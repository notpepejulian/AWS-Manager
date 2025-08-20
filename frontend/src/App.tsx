import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';

// Componentes
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Resources from './pages/Resources';
import Logs from './pages/Logs';
import SettingsPage from './pages/Settings';
import Login from './pages/Login';
import GovernanceSettings from './pages/GovernanceSettings';

// Servicios
import { apiService } from './services/apiService';
import { useAuth } from './store/authStore';

import { BarChart3, Cloud, Server, Activity, Settings, type LucideIcon } from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  current?: boolean;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Cuentas AWS', href: '/accounts', icon: Cloud },
  { name: 'Recursos', href: '/resources', icon: Server },
  { name: 'Logs', href: '/logs', icon: Activity },
  { name: 'Configuración', href: '/settings', icon: Settings },
];

// Tipos
interface BackendStatus {
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
}

// Componente de protección de rutas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, checkAuth, isLoading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      await checkAuth();
      setIsChecking(false);
    };
    verifyAuth();
  }, [checkAuth]);

  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Componente principal de la aplicación
const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();

  // Verificar estado del backend
  const { data: backendStatus, error: backendError } = useQuery<BackendStatus>(
    'backendHealth',
    apiService.getHealth,
    {
      refetchInterval: 30000, // Verificar cada 30 segundos
      retry: 3,
      retryDelay: 1000,
    }
  );

  // Configurar WebSocket
  useEffect(() => {
    if (isAuthenticated) {
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:4000', {
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('🔌 Conectado al servidor WebSocket');
        setIsConnected(true);
        toast.success('Conectado al servidor');
      });

      newSocket.on('disconnect', () => {
        console.log('🔌 Desconectado del servidor WebSocket');
        setIsConnected(false);
        toast.error('Desconectado del servidor');
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Error de conexión WebSocket:', error);
        setIsConnected(false);
        toast.error('Error de conexión con el servidor');
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated]);

  // Navegación
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Cuentas AWS', href: '/accounts', icon: Cloud },
    { name: 'Recursos', href: '/resources', icon: Server },
    { name: 'Logs', href: '/logs', icon: Activity },
    { name: 'Configuración', href: '/settings', icon: Settings },
  ];
  
  // Si no está autenticado y no está en login, mostrar login
  if (!isAuthenticated && location.pathname !== '/login') {
    return <Login />;
  }

  // Si está en login y está autenticado, redirigir al dashboard
  if (isAuthenticated && location.pathname === '/login') {
    return <Navigate to="/dashboard" replace />;
  }

  // Si está en login, mostrar solo la página de login
  if (location.pathname === '/login') {
    return <Login />;
  }

  // Mostrar error si el backend no está disponible
  if (backendError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-error-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error de Conexión</h1>
          <p className="text-gray-600 mb-4">
            No se puede conectar con el servidor backend.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <Sidebar navigation={navigation} />

      {/* Contenido principal */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header */}
        <Header
          backendStatus={backendStatus || {
            status: 'unknown',
            uptime: 0,
            timestamp: new Date().toISOString(),
            memory: { rss: 0, heapTotal: 0, heapUsed: 0, external: 0 },
            environment: 'unknown'
          }}
          isConnected={isConnected}
          selectedAccount={selectedAccount}
          onAccountChange={setSelectedAccount}
        />

        {/* Contenido de la página */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Routes>
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard socket={socket} selectedAccount={selectedAccount} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/accounts"
                  element={
                    <ProtectedRoute>
                      <Accounts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/resources"
                  element={
                    <ProtectedRoute>
                      <Resources selectedAccount={selectedAccount} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/logs"
                  element={
                    <ProtectedRoute>
                      <Logs selectedAccount={selectedAccount} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/governance-settings" element={<GovernanceSettings />} /> {/* Nueva ruta añadida */}
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </div>
        </main>
      </div>

      {/* Indicador de estado de conexión */}
      {!isConnected && (
        <div className="fixed bottom-4 right-4 bg-error-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm">Desconectado</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
