import React, { useState, useEffect } from 'react';
import { Settings, Trash2 } from 'lucide-react'; // Importar los iconos

interface Settings {
  accountId: string;
  iamUser: string;
  password: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
}

const GovernanceSettings: React.FC = () => {
  const [accountId, setAccountId] = useState('');
  const [iamUser, setIamUser] = useState('');
  const [password, setPassword] = useState('');
  const [awsAccessKeyId, setAwsAccessKeyId] = useState('');
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [settingsList, setSettingsList] = useState<Settings[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('governanceSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettingsList(Array.isArray(parsed) ? parsed : []);
      } catch {
        setSettingsList([]);
      }
    }
  }, []);

  const handleSave = () => {
    if (!accountId || !iamUser || !password || !awsAccessKeyId || !awsSecretAccessKey) {
      setError('Todos los campos son obligatorios');
      return;
    }
    setError('');

    const newSettings: Settings = {
      accountId,
      iamUser,
      password,
      awsAccessKeyId,
      awsSecretAccessKey,
    };

    let updated: Settings[];
    if (editingIndex !== null) {
      updated = [...settingsList];
      updated[editingIndex] = newSettings;
    } else {
      updated = [...settingsList, newSettings];
    }

    setSettingsList(updated);
    localStorage.setItem('governanceSettings', JSON.stringify(updated));

    setAccountId('');
    setIamUser('');
    setPassword('');
    setAwsAccessKeyId('');
    setAwsSecretAccessKey('');
    setEditingIndex(null);
  };

  const handleEdit = (index: number) => {
    const s = settingsList[index];
    setAccountId(s.accountId);
    setIamUser(s.iamUser);
    setPassword(s.password);
    setAwsAccessKeyId(s.awsAccessKeyId);
    setAwsSecretAccessKey(s.awsSecretAccessKey);
    setEditingIndex(index);
  };

  const handleDelete = (index: number) => {
    const updated = settingsList.filter((_, i) => i !== index);
    setSettingsList(updated);
    localStorage.setItem('governanceSettings', JSON.stringify(updated));
  };

  const maskKey = (key: string) =>
    key.length > 6 ? `${key.slice(0, 3)}...${key.slice(-3)}` : key;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Configuración de cuenta de gobernanza</h1>

      {/* Mostrar formulario solo si no hay datos */}
      {settingsList.length === 0 || editingIndex !== null ? (
        <div className="card bg-white rounded-lg shadow-md p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800">Cuenta de gobernanza</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Account ID o Alias</label>
              <input
                type="text"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="123456789012"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Usuario IAM</label>
              <input
                type="text"
                value={iamUser}
                onChange={(e) => setIamUser(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="usuario.iam"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <h2 className="text-lg font-semibold text-gray-800 mt-6">Keys</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">AWS Access Key ID</label>
              <input
                type="text"
                value={awsAccessKeyId}
                onChange={(e) => setAwsAccessKeyId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="AWS Access Key ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">AWS Secret Access Key</label>
              <input
                type="password"
                value={awsSecretAccessKey}
                onChange={(e) => setAwsSecretAccessKey(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="AWS Secret Access Key"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              onClick={() => {
                setAccountId('');
                setIamUser('');
                setPassword('');
                setAwsAccessKeyId('');
                setAwsSecretAccessKey('');
                setError('');
                setEditingIndex(null);
              }}
            >
              Cancelar
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Guardando...' : editingIndex !== null ? 'Actualizar' : 'Guardar'}
            </button>
          </div>

          {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
        </div>
      ) : null}

      {/* Tabla */}
      {settingsList.length > 0 && (
        <div className="card bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Configuraciones guardadas</h2>
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Account ID o Alias</th>
                <th className="px-4 py-2 text-left">Usuario IAM</th>
                <th className="px-4 py-2 text-left">Contraseña</th>
                <th className="px-4 py-2 text-left">AWS Access Key ID</th>
                <th className="px-4 py-2 text-left">AWS Secret Access Key</th>
                <th className="px-4 py-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {settingsList.map((s, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-4 py-2">{s.accountId}</td>
                  <td className="px-4 py-2">{s.iamUser}</td>
                  <td className="px-4 py-2">••••••••</td>
                  <td className="px-4 py-2">{maskKey(s.awsAccessKeyId)}</td>
                  <td className="px-4 py-2">{maskKey(s.awsSecretAccessKey)}</td>
                  <td className="px-4 py-2 space-x-2">
                    <button
                      className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                      onClick={() => handleEdit(idx)}
                    >
                      <Settings className="h-4 w-4" /> {/* Icono de editar */}
                    </button>
                    <button
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      onClick={() => handleDelete(idx)}
                    >
                      <Trash2 className="h-4 w-4" /> {/* Icono de eliminar */}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GovernanceSettings;
