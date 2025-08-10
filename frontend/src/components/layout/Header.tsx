import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Settings, 
  User, 
  LogOut, 
  ChevronDown,
  Cloud,
  Activity
} from 'lucide-react';

interface HeaderProps {
  backendStatus: {
    status: string;
    uptime: number;
    timestamp: string;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    environment: string;
  };
  isConnected: boolean;
  selectedAccount: string | null;
  onAccountChange: (accountId: string | null) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  backendStatus, 
  isConnected, 
  selectedAccount, 
  onAccountChange 
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Datos de ejemplo para las cuentas AWS
  const awsAccounts = [
    { id: '1', accountId: '123456789012', name: 'Producción', region: 'us-east-1' },
    { id: '2', accountId: '987654321098', name: 'Desarrollo', region: 'us-west-2' },
    { id: '3', accountId: '555666777888', name: 'Testing', region: 'eu-west-1' },
  ];

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatMemory = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <header className="bg-white shadow-aws border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y título */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center space-x-2">
                <Cloud className="h-8 w-8 text-aws-orange" />
                <span className="text-xl font-bold text-gray-900">AWS Management</span>
              </div>
            </div>
          </div>

          {/* Barra de búsqueda */}
          <div className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Buscar recursos, logs, métricas..."
              />
            </div>
          </div>

          {/* Selector de cuenta AWS */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <select
                value={selectedAccount || ''}
                onChange={(e) => onAccountChange(e.target.value || null)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 leading-tight focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Seleccionar cuenta</option>
                {awsAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.accountId})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>

            {/* Estado de conexión */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success-500' : 'bg-error-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>

            {/* Notificaciones */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg"
              >
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-error-500"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-aws border border-gray-200 z-50">
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Notificaciones</h3>
                    <div className="space-y-2">
                      <div className="flex items-start space-x-3 p-2 rounded-lg bg-warning-50">
                        <Activity className="h-5 w-5 text-warning-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-warning-800">
                            Alta utilización de CPU
                          </p>
                          <p className="text-xs text-warning-600">
                            Instancia i-1234567890abcdef0 en us-east-1
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-2 rounded-lg bg-success-50">
                        <Cloud className="h-5 w-5 text-success-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-success-800">
                            Backup completado
                          </p>
                          <p className="text-xs text-success-600">
                            RDS instance db-prod-01
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Menú de usuario */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg"
              >
                <User className="h-6 w-6" />
                <span className="text-sm font-medium text-gray-700">Admin</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-aws border border-gray-200 z-50">
                  <div className="py-1">
                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <User className="h-4 w-4 mr-2" />
                      Perfil
                    </button>
                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <Settings className="h-4 w-4 mr-2" />
                      Configuración
                    </button>
                    <hr className="my-1" />
                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Barra de estado del backend */}
        <div className="border-t border-gray-200 py-2">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center space-x-4">
              <span>Backend: {backendStatus.status}</span>
              <span>Uptime: {formatUptime(backendStatus.uptime)}</span>
              <span>Memoria: {formatMemory(backendStatus.memory.heapUsed)}</span>
              <span>Entorno: {backendStatus.environment}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Última actualización: {new Date(backendStatus.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay para cerrar menús */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;
