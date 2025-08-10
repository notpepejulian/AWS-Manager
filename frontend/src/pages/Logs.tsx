import React from 'react';

interface LogsProps {
  selectedAccount: string | null;
}

const Logs: React.FC<LogsProps> = ({ selectedAccount }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Logs y Monitoreo</h1>
        <p className="text-gray-600">
          {selectedAccount 
            ? `Logs de CloudWatch para la cuenta seleccionada` 
            : 'Selecciona una cuenta AWS para ver los logs'
          }
        </p>
      </div>

      <div className="text-center text-gray-500 py-12">
        <p>Página en desarrollo - Se implementará la visualización de logs de CloudWatch</p>
        <p className="text-sm mt-2">Log Groups, Log Streams, Métricas en tiempo real</p>
      </div>
    </div>
  );
};

export default Logs;
