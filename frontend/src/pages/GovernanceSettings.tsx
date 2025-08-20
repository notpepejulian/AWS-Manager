import React, { useState, useEffect } from 'react';
import { Settings, Trash2 } from 'lucide-react';

interface Settings {
  id: string;
  accountId: string;          // mapea a account_id
  iamUser: string;            // mapea a iam_user
  password: string;
  awsAccessKeyId: string;     // mapea a aws_access_key_id
  awsSecretAccessKey: string; // mapea a aws_secret_access_key
  description?: string;       // opcional
}

const GovernanceSettings: React.FC = () => {
  const [accountId, setAccountId] = useState('');
  const [iamUser, setIamUser] = useState('');
  const [password, setPassword] = useState('');
  const [awsAccessKeyId, setAwsAccessKeyId] = useState('');
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [settingsList, setSettingsList] = useState<Settings[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('http://localhost:4000/api/aws/governance', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data && Array.isArray(data)) {
          setSettingsList(
            data.map((account: any) => ({
              id: account.id || '', // Definir id con un valor por defecto
              accountId: account.account_id,
              iamUser: account.iam_user,
              password: account.password,
              awsAccessKeyId: account.aws_access_key_id,
              awsSecretAccessKey: account.aws_secret_access_key,
              description: account.description,
            }))
          );
        } else {
          setSettingsList([]);
        }
      } catch (error) {
        setError('Error al cargar la lista de configuraciones');
        setSettingsList([]);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!accountId || !iamUser || !password || !awsAccessKeyId || !awsSecretAccessKey) {
      setError('Todos los campos son obligatorios');
      return;
    }
    setError('');
    setLoading(true);

    const payload: any = {
      accountId,
      iamUser,
      password,
      awsAccessKeyId,
      awsSecretAccessKey,
    };
    if (description) payload.description = description;

    try {
      const token = localStorage.getItem('authToken');

      if (editingIndex !== null) {
        const account = settingsList[editingIndex];
        await fetch(`http://localhost:4000/api/aws/governance/${account.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const updatedList = [...settingsList];
        updatedList[editingIndex] = { ...payload };
        setSettingsList(updatedList);
      } else {
        await fetch('http://localhost:4000/api/aws/governance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        setSettingsList([...settingsList, payload]);
      }

      setAccountId('');
      setIamUser('');
      setPassword('');
      setAwsAccessKeyId('');
      setAwsSecretAccessKey('');
      setDescription('');
      setEditingIndex(null);
    } catch (err) {
      setError('Error al guardar en la base de datos');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (index: number) => {
    const s = settingsList[index];
    setAccountId(s.accountId);
    setIamUser(s.iamUser);
    setPassword(s.password);
    setAwsAccessKeyId(s.awsAccessKeyId);
    setAwsSecretAccessKey(s.awsSecretAccessKey);
    setDescription(s.description || '');
    setEditingIndex(index);
  };

  const handleDelete = async (index: number) => {
    const account = settingsList[index];
    const updated = settingsList.filter((_, i) => i !== index);
    setSettingsList(updated);

    try {
      const token = localStorage.getItem('authToken');
      await fetch(`http://localhost:4000/api/aws/governance/${account.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      setError('Error al eliminar de la base de datos');
    }
  };

  const maskKey = (key: string) => (key.length > 6 ? `${key.slice(0, 3)}...${key.slice(-3)}` : key);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Configuración de cuenta de gobernanza</h1>

      {(settingsList.length === 0 || editingIndex !== null) && (
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
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Usuario IAM</label>
              <input
                type="text"
                value={iamUser}
                onChange={(e) => setIamUser(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Descripción (opcional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
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
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">AWS Secret Access Key</label>
              <input
                type="password"
                value={awsSecretAccessKey}
                onChange={(e) => setAwsSecretAccessKey(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
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
                setDescription('');
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
      )}

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
                <th className="px-4 py-2 text-left">Descripción</th>
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
                  <td className="px-4 py-2">{s.description || '-'}</td>
                  <td className="px-4 py-2 space-x-2">
                    <button
                      className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                      onClick={() => handleEdit(idx)}
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                    <button
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      onClick={() => handleDelete(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
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
