import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { 
  Server, 
  Cloud, 
  Database, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';

interface DashboardProps {
  socket: Socket | null;
  selectedAccount: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({ socket, selectedAccount }) => {
  const [realTimeData, setRealTimeData] = useState<any>(null);

  useEffect(() => {
    if (socket) {
      socket.on('dashboard-update', (data) => {
        setRealTimeData(data);
      });

      return () => {
        socket.off('dashboard-update');
      };
    }
  }, [socket]);

  // Datos de ejemplo para el dashboard
  const stats = [
    {
      name: 'Instancias EC2',
      value: '24',
      change: '+2.5%',
      changeType: 'positive',
      icon: Server,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Load Balancers',
      value: '8',
      change: '+1',
      changeType: 'positive',
      icon: Cloud,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Bases de Datos',
      value: '12',
      change: '0%',
      changeType: 'neutral',
      icon: Database,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      name: 'Alertas Activas',
      value: '3',
      change: '-2',
      changeType: 'negative',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'instance',
      action: 'Iniciada',
      resource: 'i-1234567890abcdef0',
      account: 'Producción',
      time: '2 minutos atrás',
      status: 'success',
    },
    {
      id: 2,
      type: 'backup',
      action: 'Completado',
      resource: 'RDS db-prod-01',
      account: 'Producción',
      time: '15 minutos atrás',
      status: 'success',
    },
    {
      id: 3,
      type: 'alert',
      action: 'Alta CPU',
      resource: 'i-0987654321fedcba0',
      account: 'Desarrollo',
      time: '1 hora atrás',
      status: 'warning',
    },
    {
      id: 4,
      type: 'security',
      action: 'Grupo de seguridad actualizado',
      resource: 'sg-12345678',
      account: 'Producción',
      time: '2 horas atrás',
      status: 'info',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning-500" />;
      case 'info':
        return <Activity className="h-4 w-4 text-primary-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="bg-gray-100 p-6 rounded-lg shadow-lg space-y-6 backdrop-blur-md">
      {/* Header del Dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-700">
            {selectedAccount 
              ? `Vista general de la cuenta seleccionada` 
              : 'Selecciona una cuenta AWS para ver los datos'
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <div className="w-2 h-2 bg-success-500 rounded-full"></div>
            <span>Actualizado en tiempo real</span>
          </div>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow-md p-4 backdrop-blur-md">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-700">{stat.name}</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  <span className={`ml-2 text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-success-600' :
                    stat.changeType === 'negative' ? 'text-error-600' :
                    'text-gray-500'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos y métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de uso de CPU */}
        <div className="bg-white rounded-lg shadow-md p-4 backdrop-blur-md">
          <div className="card-header">
            <h3 className="card-title text-lg font-semibold">Uso de CPU - Últimas 24 horas</h3>
            <p className="card-subtitle text-gray-500">Promedio de utilización de CPU por instancia</p>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Gráfico de métricas (Recharts)</p>
              <p className="text-sm text-gray-400">Se integrará con CloudWatch</p>
            </div>
          </div>
        </div>

        {/* Gráfico de costos */}
        <div className="bg-white rounded-lg shadow-md p-4 backdrop-blur-md">
          <div className="card-header">
            <h3 className="card-title text-lg font-semibold">Costos AWS - Este mes</h3>
            <p className="card-subtitle text-gray-500">Desglose de costos por servicio</p>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Gráfico de costos (Recharts)</p>
              <p className="text-sm text-gray-400">Se integrará con Cost Explorer</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="bg-white rounded-lg shadow-md p-4 backdrop-blur-md">
        <div className="card-header">
          <h3 className="card-title text-lg font-semibold">Actividad Reciente</h3>
          <p className="card-subtitle text-gray-500">Últimas acciones y eventos en tus cuentas AWS</p>
        </div>
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0">
                {getStatusIcon(activity.status)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {activity.action} - {activity.resource}
                </p>
                <p className="text-sm text-gray-500">
                  {activity.account} • {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Ver toda la actividad →
          </button>
        </div>
      </div>

      {/* Estado de servicios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-4 backdrop-blur-md">
          <div className="card-header">
            <h3 className="card-title text-lg font-semibold">Estado de Servicios</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">EC2</span>
              <span className="badge badge-success">Operacional</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">RDS</span>
              <span className="badge badge-success">Operacional</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">S3</span>
              <span className="badge badge-success">Operacional</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">CloudWatch</span>
              <span className="badge badge-warning">Degradado</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 backdrop-blur-md">
          <div className="card-header">
            <h3 className="card-title text-lg font-semibold">Alertas</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-error-500 rounded-full"></div>
              <span className="text-sm text-gray-900">Alta utilización de CPU</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
              <span className="text-sm text-gray-900">Espacio en disco bajo</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-success-500 rounded-full"></div>
              <span className="text-sm text-gray-900">Backup completado</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 backdrop-blur-md">
          <div className="card-header">
            <h3 className="card-title text-lg font-semibold">Próximas Acciones</h3>
          </div>
          <div className="space-y-3">
            <div className="text-sm">
              <p className="font-medium text-gray-900">Mantenimiento programado</p>
              <p className="text-gray-500">Mañana 2:00 AM UTC</p>
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">Rotación de claves</p>
              <p className="text-gray-500">En 3 días</p>
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">Revisión de costos</p>
              <p className="text-gray-500">Esta semana</p>
            </div>
          </div>
        </div>
      </div>

      {/* Datos en tiempo real */}
      {realTimeData && (
        <div className="bg-white rounded-lg shadow-md p-4 backdrop-blur-md">
          <div className="card-header">
            <h3 className="card-title text-lg font-semibold">Datos en Tiempo Real</h3>
            <p className="card-subtitle text-gray-500">Actualizaciones en vivo desde WebSocket</p>
          </div>
          <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto">
            {JSON.stringify(realTimeData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
