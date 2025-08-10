import React from 'react';
import { Plus, Settings, Trash2, Eye } from 'lucide-react';

const Accounts: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cuentas AWS</h1>
          <p className="text-gray-600">Gestiona tus cuentas de AWS y configuraciones</p>
        </div>
        <button className="btn-primary flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Agregar Cuenta</span>
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Cuentas Configuradas</h3>
          <p className="card-subtitle">Todas las cuentas AWS conectadas a tu perfil</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="resource-table">
            <thead>
              <tr>
                <th>Cuenta</th>
                <th>Nombre</th>
                <th>Región</th>
                <th>Estado</th>
                <th>Último Acceso</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>123456789012</td>
                <td>Producción</td>
                <td>us-east-1</td>
                <td><span className="badge badge-success">Activa</span></td>
                <td>Hace 2 horas</td>
                <td>
                  <div className="flex space-x-2">
                    <button className="p-1 text-primary-600 hover:text-primary-700">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-600 hover:text-gray-700">
                      <Settings className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-error-600 hover:text-error-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td>987654321098</td>
                <td>Desarrollo</td>
                <td>us-west-2</td>
                <td><span className="badge badge-success">Activa</span></td>
                <td>Hace 1 día</td>
                <td>
                  <div className="flex space-x-2">
                    <button className="p-1 text-primary-600 hover:text-primary-700">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-600 hover:text-gray-700">
                      <Settings className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-error-600 hover:text-error-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-center text-gray-500">
        <p>Página en desarrollo - Se implementará la gestión completa de cuentas AWS</p>
      </div>
    </div>
  );
};

export default Accounts;
