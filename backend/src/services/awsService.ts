import AWS from 'aws-sdk';
import { AWSAccount, AWSConfig, EC2Instance, LoadBalancer, VPC, CloudWatchMetric, LogGroup, LogStream } from '../types';

// ========================================
// SERVICIO PRINCIPAL DE AWS
// ========================================

export class AWSService {
  private config: AWSConfig;
  private services: {
    ec2?: AWS.EC2;
    elbv2?: AWS.ELBv2;
    cloudwatch?: AWS.CloudWatch;
    logs?: AWS.CloudWatchLogs;
    iam?: AWS.IAM;
    sts?: AWS.STS;
  } = {};

  constructor(config: AWSConfig) {
    this.config = config;
    this.initializeServices();
  }

  // ========================================
  // INICIALIZACIÓN DE SERVICIOS AWS
  // ========================================

  private initializeServices(): void {
    const awsConfig: AWS.Config = {
      region: this.config.region,
      accessKeyId: this.config.accessKeyId,
      secretAccessKey: this.config.secretAccessKey,
      sessionToken: this.config.sessionToken,
    };

    this.services.ec2 = new AWS.EC2(awsConfig);
    this.services.elbv2 = new AWS.ELBv2(awsConfig);
    this.services.cloudwatch = new AWS.CloudWatch(awsConfig);
    this.services.logs = new AWS.CloudWatchLogs(awsConfig);
    this.services.iam = new AWS.IAM(awsConfig);
    this.services.sts = new AWS.STS(awsConfig);
  }

  // ========================================
  // MÉTODOS DE AUTENTICACIÓN
  // ========================================

  async assumeRole(roleArn: string, sessionName: string, mfaCode?: string): Promise<AWS.STS.AssumeRoleResponse> {
    if (!this.services.sts) throw new Error('STS service not initialized');

    const params: AWS.STS.AssumeRoleRequest = {
      RoleArn: roleArn,
      RoleSessionName: sessionName,
      DurationSeconds: 3600, // 1 hora
    };

    if (mfaCode) {
      params.SerialNumber = process.env.AWS_MFA_SERIAL;
      params.TokenCode = mfaCode;
    }

    return await this.services.sts.assumeRole(params).promise();
  }

  async getCallerIdentity(): Promise<AWS.STS.GetCallerIdentityResponse> {
    if (!this.services.sts) throw new Error('STS service not initialized');
    return await this.services.sts.getCallerIdentity().promise();
  }

  // ========================================
  // SERVICIOS EC2
  // ========================================

  async getEC2Instances(): Promise<EC2Instance[]> {
    if (!this.services.ec2) throw new Error('EC2 service not initialized');

    const instances: EC2Instance[] = [];
    let nextToken: string | undefined;

    do {
      const params: AWS.EC2.DescribeInstancesRequest = {
        MaxResults: 100,
        ...(nextToken && { NextToken: nextToken })
      };

      const response = await this.services.ec2.describeInstances(params).promise();
      
      response.Reservations?.forEach(reservation => {
        reservation.Instances?.forEach(instance => {
          if (instance.InstanceId) {
            instances.push({
              instanceId: instance.InstanceId,
              instanceType: instance.InstanceType || 'unknown',
              state: instance.State?.Name || 'unknown',
              publicIp: instance.PublicIpAddress,
              privateIp: instance.PrivateIpAddress,
              vpcId: instance.VpcId || '',
              subnetId: instance.SubnetId || '',
              securityGroups: instance.SecurityGroups?.map(sg => sg.GroupId || '') || [],
              tags: this.parseTags(instance.Tags),
              launchTime: instance.LaunchTime || new Date(),
            });
          }
        });
      });

      nextToken = response.NextToken;
    } while (nextToken);

    return instances;
  }

  async getVPCs(): Promise<VPC[]> {
    if (!this.services.ec2) throw new Error('EC2 service not initialized');

    const vpcs: VPC[] = [];
    let nextToken: string | undefined;

    do {
      const params: AWS.EC2.DescribeVpcsRequest = {
        MaxResults: 100,
        ...(nextToken && { NextToken: nextToken })
      };

      const response = await this.services.ec2.describeVpcs(params).promise();
      
      for (const vpc of response.Vpcs || []) {
        if (vpc.VpcId) {
          const subnets = await this.getSubnetsForVPC(vpc.VpcId);
          const routeTables = await this.getRouteTablesForVPC(vpc.VpcId);

          vpcs.push({
            vpcId: vpc.VpcId,
            cidrBlock: vpc.CidrBlock || '',
            state: vpc.State || 'unknown',
            isDefault: vpc.IsDefault || false,
            subnets,
            routeTables,
          });
        }
      }

      nextToken = response.NextToken;
    } while (nextToken);

    return vpcs;
  }

  private async getSubnetsForVPC(vpcId: string): Promise<any[]> {
    if (!this.services.ec2) throw new Error('EC2 service not initialized');

    const response = await this.services.ec2.describeSubnets({
      Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
    }).promise();

    return response.Subnets?.map(subnet => ({
      subnetId: subnet.SubnetId,
      vpcId: subnet.VpcId,
      cidrBlock: subnet.CidrBlock,
      availabilityZone: subnet.AvailabilityZone,
      state: subnet.State,
      routeTableId: '', // Se llenará después
    })) || [];
  }

  private async getRouteTablesForVPC(vpcId: string): Promise<any[]> {
    if (!this.services.ec2) throw new Error('EC2 service not initialized');

    const response = await this.services.ec2.describeRouteTables({
      Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
    }).promise();

    return response.RouteTables?.map(routeTable => ({
      routeTableId: routeTable.RouteTableId,
      vpcId: routeTable.VpcId,
      routes: routeTable.Routes?.map(route => ({
        destination: route.DestinationCidrBlock || route.DestinationPrefixListId || '',
        target: route.GatewayId || route.NatGatewayId || route.VpcPeeringConnectionId || '',
        state: route.State || 'unknown',
      })) || [],
      associations: routeTable.Associations?.map(association => ({
        routeTableAssociationId: association.RouteTableAssociationId,
        subnetId: association.SubnetId,
        gatewayId: association.GatewayId,
      })) || [],
    })) || [];
  }

  // ========================================
  // SERVICIOS DE LOAD BALANCER
  // ========================================

  async getLoadBalancers(): Promise<LoadBalancer[]> {
    if (!this.services.elbv2) throw new Error('ELBv2 service not initialized');

    const loadBalancers: LoadBalancer[] = [];
    let nextToken: string | undefined;

    do {
      const params: AWS.ELBv2.DescribeLoadBalancersInput = {
        PageSize: 100,
        ...(nextToken && { Marker: nextToken })
      };

      const response = await this.services.elbv2.describeLoadBalancers(params).promise();
      
      for (const lb of response.LoadBalancers || []) {
        if (lb.LoadBalancerArn) {
          const listeners = await this.getLoadBalancerListeners(lb.LoadBalancerArn);
          const targetGroups = await this.getTargetGroupsForLB(lb.LoadBalancerArn);

          loadBalancers.push({
            loadBalancerArn: lb.LoadBalancerArn,
            loadBalancerName: lb.LoadBalancerName || '',
            type: lb.Type as 'application' | 'network' | 'gateway',
            scheme: lb.Scheme as 'internet-facing' | 'internal',
            state: lb.State?.Code || 'unknown',
            vpcId: lb.VpcId || '',
            availabilityZones: lb.AvailabilityZones?.map(az => az.ZoneName || '') || [],
            listeners,
            targetGroups,
          });
        }
      }

      nextToken = response.NextMarker;
    } while (nextToken);

    return loadBalancers;
  }

  private async getLoadBalancerListeners(lbArn: string): Promise<any[]> {
    if (!this.services.elbv2) throw new Error('ELBv2 service not initialized');

    const response = await this.services.elbv2.describeListeners({
      LoadBalancerArn: lbArn
    }).promise();

    return response.Listeners?.map(listener => ({
      listenerArn: listener.ListenerArn,
      port: listener.Port,
      protocol: listener.Protocol,
      defaultActions: listener.DefaultActions,
    })) || [];
  }

  private async getTargetGroupsForLB(lbArn: string): Promise<any[]> {
    if (!this.services.elbv2) throw new Error('ELBv2 service not initialized');

    const response = await this.services.elbv2.describeTargetGroups().promise();
    
    return response.TargetGroups?.map(tg => ({
      targetGroupArn: tg.TargetGroupArn,
      targetGroupName: tg.TargetGroupName,
      protocol: tg.Protocol,
      port: tg.Port,
      vpcId: tg.VpcId,
      targets: [], // Se llenará después si es necesario
    })) || [];
  }

  // ========================================
  // SERVICIOS DE CLOUDWATCH
  // ========================================

  async getMetrics(namespace: string, metricName: string, dimensions: Record<string, string>[] = []): Promise<CloudWatchMetric> {
    if (!this.services.cloudwatch) throw new Error('CloudWatch service not initialized');

    const params: AWS.CloudWatch.GetMetricStatisticsInput = {
      Namespace: namespace,
      MetricName: metricName,
      StartTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24 horas
      EndTime: new Date(),
      Period: 300, // 5 minutos
      Statistics: ['Average', 'Maximum', 'Minimum'],
      Dimensions: dimensions.map(dim => ({
        Name: Object.keys(dim)[0],
        Value: Object.values(dim)[0]
      }))
    };

    const response = await this.services.cloudwatch.getMetricStatistics(params).promise();

    return {
      namespace,
      metricName,
      dimensions,
      dataPoints: response.Datapoints?.map(dp => ({
        timestamp: dp.Timestamp || new Date(),
        value: dp.Average || dp.Maximum || dp.Minimum || 0,
        unit: dp.Unit || 'None',
      })) || []
    };
  }

  // ========================================
  // SERVICIOS DE CLOUDWATCH LOGS
  // ========================================

  async getLogGroups(): Promise<LogGroup[]> {
    if (!this.services.logs) throw new Error('CloudWatch Logs service not initialized');

    const logGroups: LogGroup[] = [];
    let nextToken: string | undefined;

    do {
      const params: AWS.CloudWatchLogs.DescribeLogGroupsRequest = {
        limit: 50,
        ...(nextToken && { nextToken })
      };

      const response = await this.services.logs.describeLogGroups(params).promise();
      
      response.logGroups?.forEach(lg => {
        logGroups.push({
          logGroupName: lg.logGroupName || '',
          creationTime: lg.creationTime || 0,
          retentionInDays: lg.retentionInDays,
          metricFilterCount: lg.metricFilterCount || 0,
          storedBytes: lg.storedBytes || 0,
        });
      });

      nextToken = response.nextToken;
    } while (nextToken);

    return logGroups;
  }

  async getLogStreams(logGroupName: string): Promise<LogStream[]> {
    if (!this.services.logs) throw new Error('CloudWatch Logs service not initialized');

    const logStreams: LogStream[] = [];
    let nextToken: string | undefined;

    do {
      const params: AWS.CloudWatchLogs.DescribeLogStreamsRequest = {
        logGroupName,
        orderBy: 'LastEventTime',
        descending: true,
        limit: 50,
        ...(nextToken && { nextToken })
      };

      const response = await this.services.logs.describeLogStreams(params).promise();
      
      response.logStreams?.forEach(ls => {
        logStreams.push({
          logStreamName: ls.logStreamName || '',
          creationTime: ls.creationTime || 0,
          firstEventTime: ls.firstEventTime,
          lastEventTime: ls.lastEventTime,
          storedBytes: ls.storedBytes || 0,
          logEvents: [], // Se llenará si es necesario
        });
      });

      nextToken = response.nextToken;
    } while (nextToken);

    return logStreams;
  }

  async getLogEvents(logGroupName: string, logStreamName: string, limit: number = 100): Promise<any[]> {
    if (!this.services.logs) throw new Error('CloudWatch Logs service not initialized');

    const params: AWS.CloudWatchLogs.GetLogEventsRequest = {
      logGroupName,
      logStreamName,
      limit,
      startFromHead: false,
    };

    const response = await this.services.logs.getLogEvents(params).promise();

    return response.events?.map(event => ({
      timestamp: event.timestamp,
      message: event.message,
      logStreamName,
    })) || [];
  }

  // ========================================
  // UTILIDADES
  // ========================================

  private parseTags(tags?: AWS.EC2.Tag[]): Record<string, string> {
    const result: Record<string, string> = {};
    tags?.forEach(tag => {
      if (tag.Key && tag.Value) {
        result[tag.Key] = tag.Value;
      }
    });
    return result;
  }

  // ========================================
  // MÉTODOS DE INVENTARIO COMPLETO
  // ========================================

  async getCompleteInventory(): Promise<{
    instances: EC2Instance[];
    loadBalancers: LoadBalancer[];
    vpcs: VPC[];
    logGroups: LogGroup[];
  }> {
    console.log('🔄 Obteniendo inventario completo de AWS...');

    const [instances, loadBalancers, vpcs, logGroups] = await Promise.all([
      this.getEC2Instances(),
      this.getLoadBalancers(),
      this.getVPCs(),
      this.getLogGroups(),
    ]);

    console.log(`✅ Inventario obtenido: ${instances.length} instancias, ${loadBalancers.length} load balancers, ${vpcs.length} VPCs, ${logGroups.length} log groups`);

    return {
      instances,
      loadBalancers,
      vpcs,
      logGroups,
    };
  }
}
