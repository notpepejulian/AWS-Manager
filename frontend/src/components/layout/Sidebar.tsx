import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Cloud, 
  Server, 
  Activity, 
  Database, 
  Shield, 
  Globe, 
  Zap, 
  Users, 
  Settings,
  Menu,
  X
} from 'lucide-react';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  BarChart3,
  Cloud,
  Server,
  Activity,
  Database,
  Shield,
  Globe,
  Zap,
  Users,
  Settings,
};


import { LucideIcon } from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;  // corregir tipo icon aquí
  current?: boolean; // opcional
}

interface SidebarProps {
  navigation: NavigationItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ navigation }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const updatedNavigation = navigation.map(item => ({
    ...item,
    current: location.pathname === item.href,
  }));

  const renderIcon = (IconComponent: LucideIcon, cls: string) => (
    <IconComponent className={cls} />
  );

  return (
    <>
      {/* Sidebar para desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
            {/* Logo */}
            <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-50">
              <div className="flex items-center space-x-2">
                <Cloud className="h-8 w-8 text-aws-orange" />
                <span className="text-lg font-semibold text-gray-900">AWS Management</span>
              </div>
            </div>

            {/* Navegación */}
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-2 py-4 space-y-1">
                {updatedNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      item.current
                        ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {renderIcon(
                        item.icon, 
                        `mr-3 h-5 w-5 flex-shrink-0 ${
                          item.current ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                        }`
                      )}
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Footer del sidebar */}
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center w-full">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">A</span>
                  </div>
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
                  <p className="text-xs text-gray-500 truncate">admin@example.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar móvil */}
      <div className={`lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 flex z-40">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Logo móvil */}
            <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-50">
              <div className="flex items-center space-x-2">
                <Cloud className="h-8 w-8 text-aws-orange" />
                <span className="text-lg font-semibold text-gray-900">AWS Management</span>
              </div>
            </div>

            {/* Navegación móvil */}
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-2 py-4 space-y-1">
                {updatedNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-lg transition-colors duration-200 ${
                      item.current
                        ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {renderIcon(item.icon, `mr-4 h-6 w-6 flex-shrink-0 ${
                      item.current ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`)}
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Footer móvil */}
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center w-full">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">A</span>
                  </div>
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
                  <p className="text-xs text-gray-500 truncate">admin@example.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botón para abrir sidebar móvil */}
      <div className="lg:hidden">
        <button
          type="button"
          className="fixed top-4 left-4 z-50 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
    </>
  );
};

export default Sidebar;
