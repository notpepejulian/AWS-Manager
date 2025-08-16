import React, { useState, useEffect } from 'react';
import { Plus, Settings, Trash2, Eye, Save, X } from 'lucide-react';
import { apiService } from '../services/apiService';

interface Account {
  id: string;
  name: string;
  roleArn: string;
  status: string;
  lastAccess: string;
}

const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newAccount, setNewAccount] = useState<{
    accountId: string;
    accountName: string;
    roleArn: string;
    // description?: string;
  }>({
    accountId: '',
    accountName: '',
    roleArn: '',
    // description: '',
  });

  // Cargar cuentas al montar
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getAWSAccounts();
      if (res.success && res.data) {
        setAccounts(
          res.data.map((acc: any) => ({
            id: acc.id || acc.account_id,
            name: acc.account_name || acc.name,
            roleArn: acc.role_arn.split('/').pop() || acc.role_arn, // Extraer solo el nombre del rol
            status: acc.is_active ? 'Activa' : 'Inactiva',
            lastAccess: acc.last_assumed_at ? new Date(acc.last_assumed_at).toLocaleString() : 'Nunca',
          }))
        );
      } else {
        setAccounts([]);
      }
    } catch (err) {
      setError('Error al cargar cuentas');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async () => {
    if (!newAccount.accountId || !newAccount.accountName || !newAccount.roleArn) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }
    try {
      const payload: any = {
        accountId: newAccount.accountId,
        accountName: newAccount.accountName,
        roleArn: `arn:aws:iam::${newAccount.accountId}:role/${newAccount.roleArn}`, // concatenar ARN completo
      };
  
      const response = await apiService.addAWSAccount(payload);
      if (response.success) {
        setNewAccount({ accountId: '', accountName: '', roleArn: '' }); // Inicializado como vacío
        await fetchAccounts();
      } else {
        setError(response.error || 'Error al añadir cuenta');
      }
    } catch (error) {
      console.error("Error al agregar la cuenta:", error);
      setError('Error al agregar la cuenta');
    }
  };
  

  const handleSaveAccount = async (accountId: string) => {
    if (!newAccount.accountId || !newAccount.accountName || !newAccount.roleArn) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        accountId: newAccount.accountId,
        accountName: newAccount.accountName,
        roleArn: `arn:aws:iam::${newAccount.accountId}:role/${newAccount.roleArn}`, // concatenar ARN completo
      };
      const res = await apiService.addAWSAccount(payload);
      if (res.success) {
        setNewAccount({ accountId: '', accountName: '', roleArn: '' });
        await fetchAccounts();
      } else {
        setError(res.error || 'Error al agregar cuenta'); // Cambiado para reflejar que se está agregando
      }
    } catch (err) {
      console.error("Error al agregar la cuenta:", err);
      setError('Error 500: Ocurrió un error interno al procesar la solicitud.'); // Mensaje de error más específico
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta cuenta?')) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.deleteAWSAccount(id);
      if (res.success) {
        await fetchAccounts();
      } else {
        setError(res.error || 'Error al eliminar cuenta');
      }
    } catch (err) {
      setError('Error al eliminar cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cuentas AWS</h1>
          <p className="text-gray-600">Gestiona tus cuentas de AWS y configuraciones</p>
        </div>
        <button 
          className="btn-primary flex items-center space-x-2"
          onClick={() => setShowForm(true)} // Cambiado para mostrar el formulario al hacer clic
        >
          <Plus className="h-4 w-4" />
          <span>Agregar Cuenta</span>
        </button>
      </div>

      {showForm && (
        <div className="card bg-white rounded-lg shadow-md">
          <div className="card-header bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-lg">
            <h3 className="card-title text-lg font-semibold text-gray-900">Nueva Cuenta</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">ID de Cuenta</label>
                <input
                  type="text"
                  value={newAccount.accountId}
                  onChange={(e) => setNewAccount({ ...newAccount, accountId: e.target.value })}
                  className="input-field w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123456789012"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  type="text"
                  value={newAccount.accountName}
                  onChange={(e) => setNewAccount({ ...newAccount, accountName: e.target.value })}
                  className="input-field w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre de la cuenta"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Nombre del Rol</label>
                <input
                  type="text"
                  value={newAccount.roleArn}
                  onChange={(e) => setNewAccount({ ...newAccount, roleArn: e.target.value })}
                  className="input-field w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="MyRole"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button 
                className="btn-secondary flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                onClick={() => setShowForm(false)}
              >
                <X className="h-4 w-4" />
                <span>Cancelar</span>
              </button>
              <button 
                className="btn-primary flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => handleSaveAccount(newAccount.accountId)} // Pasar el ID de la cuenta
                disabled={loading}
              >
                <Save className="h-4 w-4" />
                <span>{loading ? 'Guardando...' : 'Guardar'}</span>
              </button>
            </div>
            {error && <div className="text-error-600 text-sm mt-2">{error}</div>}
          </div>
        </div>
      )}

      {loading && !showForm && (
        <div className="text-center text-gray-500 py-4">Cargando...</div>
      )}
      {error && !showForm && (
        <div className="text-center text-error-600 py-4">{error}</div>
      )}

      {accounts.length > 0 ? (
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
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Último Acceso</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id}>
                    <td>{account.id}</td>
                    <td>{account.name}</td>
                    <td>{account.roleArn}</td>
                    <td><span className={`badge ${account.status === 'Activa' ? 'badge-success' : 'badge-warning'}`}>{account.status}</span></td>
                    <td>{account.lastAccess}</td>
                    <td>
                      <div className="flex space-x-2">
                        <button 
                          className="p-1 text-primary-600 hover:text-primary-700"
                          onClick={() => alert(`Ver detalles de ${account.name}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-1 text-gray-600 hover:text-gray-700"
                          onClick={() => alert(`Configurar ${account.name}`)}
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-1 text-error-600 hover:text-error-700"
                          onClick={() => handleDeleteAccount(account.id)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-12">
          <p>No hay cuentas configuradas. Agrega una cuenta para comenzar.</p>
        </div>
      )}
    </div>
  );
};

export default Accounts;
