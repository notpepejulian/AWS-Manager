// ========================================
// TIPOS PRINCIPALES DE LA APLICACIÓN
// ========================================

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AWSAccount {
  id: string;
  userId: string;
  accountId: string;
  accountName: string;
  roleArn: string;
  region: string;
  isActive: boolean;
  lastAccessed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AWSSession {
  id: string;
  accountId: string;
  sessionToken: string;
  expiresAt: Date;
  mfaRequired: boolean;
  mfaCode?: string;
}

export interface AWSResource {
  id: string;
  accountId: string;
  service: string;
  resourceType: string;
  resourceId: string;
  resourceName: string;
  region: string;
  tags: Record<string, string>;
  metadata: any;
  lastUpdated: Date;
}

export interface Dashboard {
  id: string;
  userId: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'map';
  title: string;
  config: any;
  dataSource: {
    service: string;
    resourceType: string;
    accountId: string;
    region?: string;
  };
}

export interface EC2Instance {
  instanceId: string;
  instanceType: string;
  state: string;
  publicIp?: string;
  privateIp?: string;
  vpcId: string;
  subnetId: string;
  securityGroups: string[];
  tags: Record<string, string>;
  launchTime: Date;
}

export interface LoadBalancer {
  loadBalancerArn: string;
  loadBalancerName: string;
  type: 'application' | 'network' | 'gateway';
  scheme: 'internet-facing' | 'internal';
  state: string;
  vpcId: string;
  availabilityZones: string[];
  listeners: LoadBalancerListener[];
  targetGroups: TargetGroup[];
}

export interface LoadBalancerListener {
  listenerArn: string;
  port: number;
  protocol: string;
  defaultActions: any[];
}

export interface TargetGroup {
  targetGroupArn: string;
  targetGroupName: string;
  protocol: string;
  port: number;
  vpcId: string;
  targets: Target[];
}

export interface Target {
  id: string;
  port: number;
  health: string;
}

export interface VPC {
  vpcId: string;
  cidrBlock: string;
  state: string;
  isDefault: boolean;
  subnets: Subnet[];
  routeTables: RouteTable[];
}

export interface Subnet {
  subnetId: string;
  vpcId: string;
  cidrBlock: string;
  availabilityZone: string;
  state: string;
  routeTableId: string;
}

export interface RouteTable {
  routeTableId: string;
  vpcId: string;
  routes: Route[];
  associations: RouteTableAssociation[];
}

export interface Route {
  destination: string;
  target: string;
  state: string;
}

export interface RouteTableAssociation {
  routeTableAssociationId: string;
  subnetId?: string;
  gatewayId?: string;
}

export interface CloudWatchMetric {
  namespace: string;
  metricName: string;
  dimensions: Record<string, string>[];
  dataPoints: MetricDataPoint[];
}

export interface MetricDataPoint {
  timestamp: Date;
  value: number;
  unit: string;
}

export interface LogGroup {
  logGroupName: string;
  creationTime: number;
  retentionInDays?: number;
  metricFilterCount: number;
  storedBytes: number;
}

export interface LogStream {
  logStreamName: string;
  creationTime: number;
  firstEventTime?: number;
  lastEventTime?: number;
  storedBytes: number;
  logEvents: LogEvent[];
}

export interface LogEvent {
  timestamp: number;
  message: string;
  logStreamName: string;
}

// ========================================
// TIPOS PARA API RESPONSES
// ========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ========================================
// TIPOS PARA CONFIGURACIÓN
// ========================================

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export interface AWSConfig {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
}

// ========================================
// TIPOS PARA MIDDLEWARE
// ========================================

export interface AuthenticatedRequest extends Request {
  user?: User;
  awsAccount?: AWSAccount;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}
