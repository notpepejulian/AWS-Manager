import React from 'react';

const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600">Gestiona la configuración de tu cuenta y preferencias</p>
      </div>

      <div className="text-center text-gray-500 py-12">
        <p>Página en desarrollo - Se implementará la configuración completa del sistema</p>
        <p className="text-sm mt-2">Perfil de usuario, preferencias, notificaciones, etc.</p>
      </div>
    </div>
  );
};

export default SettingsPage;
