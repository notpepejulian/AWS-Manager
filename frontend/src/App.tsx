import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useQuery } from 'react-query';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { 
  Cloud, 
  Server, 
  Database, 
  BarChart3, 
  Settings, 
  Users,
  Activity,
  Shield,
  Globe,
  Zap
} from 'lucide-react';

// Componentes (se crearán después)
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import Dashboard from '@/pages/Dashboard';
import Accounts from '@/pages/Accounts';
import Resources from '@/pages/Resources';
import Logs from '@/pages/Logs';
import SettingsPage from '@/pages/Settings';
import Login from '@/pages/Login';

// Servicios (se crearán después)
import { apiService } from '@/services/apiService';

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

const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  // Verificar estado del backend
  const { data: backendStatus, error: backendError } = useQuery<BackendStatus>(
    'backendStatus',
    () => apiService.getHealth(),
    {
      refetchInterval: 30000, // Verificar cada 30 segundos
      retry: 3,
      onError: (error) => {
        console.error('Error conectando al backend:', error);
        toast.error('No se puede conectar al servidor');
      }
    }
  );

  // Configurar WebSocket
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:4000');
    
    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('🔌 Conectado al servidor WebSocket');
      toast.success('Conectado en tiempo real');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('🔌 Desconectado del servidor WebSocket');
      toast.error('Desconectado del servidor');
    });

    newSocket.on('error', (error) => {
      console.error('❌ Error de WebSocket:', error);
      toast.error('Error de conexión en tiempo real');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Unirse a la cuenta seleccionada
  useEffect(() => {
    if (socket && selectedAccount) {
      socket.emit('join-account', selectedAccount);
    }
  }, [socket, selectedAccount]);

  // Menú de navegación
  const navigation = [
    { name: 'Dashboard', href: '/', icon: BarChart3, current: true },
    { name: 'Cuentas AWS', href: '/accounts', icon: Cloud, current: false },
    { name: 'Recursos', href: '/resources', icon: Server, current: false },
    { name: 'Logs', href: '/logs', icon: Activity, current: false },
    { name: 'Base de Datos', href: '/database', icon: Database, current: false },
    { name: 'Seguridad', href: '/security', icon: Shield, current: false },
    { name: 'Redes', href: '/networking', icon: Globe, current: false },
    { name: 'Automatización', href: '/automation', icon: Zap, current: false },
    { name: 'Usuarios', href: '/users', icon: Users, current: false },
    { name: 'Configuración', href: '/settings', icon: Settings, current: false },
  ];

  // Si hay error de backend, mostrar página de error
  if (backendError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Servidor no disponible
          </h1>
          <p className="text-gray-600 mb-4">
            No se puede conectar al servidor backend. Verifica que esté ejecutándose.
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

  // Si el backend está cargando, mostrar loading
  if (!backendStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Conectando al servidor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        backendStatus={backendStatus}
        isConnected={isConnected}
        selectedAccount={selectedAccount}
        onAccountChange={setSelectedAccount}
      />

      {/* Sidebar y contenido principal */}
      <div className="flex">
        <Sidebar navigation={navigation} />
        
        {/* Contenido principal */}
        <main className="flex-1 lg:ml-64">
          <div className="p-6">
            <Routes>
              <Route path="/" element={<Dashboard socket={socket} selectedAccount={selectedAccount} />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/resources" element={<Resources selectedAccount={selectedAccount} />} />
              <Route path="/logs" element={<Logs selectedAccount={selectedAccount} />} />
              <Route path="/database" element={<div>Base de Datos (en desarrollo)</div>} />
              <Route path="/security" element={<div>Seguridad (en desarrollo)</div>} />
              <Route path="/networking" element={<div>Redes (en desarrollo)</div>} />
              <Route path="/automation" element={<div>Automatización (en desarrollo)</div>} />
              <Route path="/users" element={<div>Usuarios (en desarrollo)</div>} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<div>Página no encontrada</div>} />
            </Routes>
          </div>
        </main>
      </div>

      {/* Indicador de estado de conexión */}
      <div className={`fixed bottom-4 right-4 p-3 rounded-full shadow-lg transition-all duration-300 ${
        isConnected ? 'bg-success-500 text-white' : 'bg-error-500 text-white'
      }`}>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-white' : 'bg-white'}`}></div>
          <span className="text-sm font-medium">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default App;
