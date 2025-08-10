import React from 'react';

interface ResourcesProps {
  selectedAccount: string | null;
}

const Resources: React.FC<ResourcesProps> = ({ selectedAccount }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recursos AWS</h1>
        <p className="text-gray-600">
          {selectedAccount 
            ? `Recursos de la cuenta seleccionada` 
            : 'Selecciona una cuenta AWS para ver los recursos'
          }
        </p>
      </div>

      <div className="text-center text-gray-500 py-12">
        <p>Página en desarrollo - Se implementará la gestión completa de recursos AWS</p>
        <p className="text-sm mt-2">EC2, RDS, S3, Load Balancers, etc.</p>
      </div>
    </div>
  );
};

export default Resources;
