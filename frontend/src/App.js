import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [backendStatus, setBackendStatus] = useState('checking');
  const [backendData, setBackendData] = useState(null);

  useEffect(() => {
    // Verificar conexión con el backend
    fetch('http://localhost:4000/health')
      .then(response => response.json())
      .then(data => {
        setBackendStatus('connected');
        setBackendData(data);
      })
      .catch(error => {
        console.error('Error connecting to backend:', error);
        setBackendStatus('disconnected');
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>AWS Management System</h1>
        <p>Frontend funcionando correctamente</p>
        
        <div className="status-section">
          <h2>Estado del Sistema</h2>
          <div className="status-item">
            <span>Frontend: </span>
            <span className="status-connected">✅ Conectado</span>
          </div>
          <div className="status-item">
            <span>Backend: </span>
            <span className={`status-${backendStatus}`}>
              {backendStatus === 'connected' ? '✅ Conectado' : 
               backendStatus === 'checking' ? '⏳ Verificando...' : '❌ Desconectado'}
            </span>
          </div>
        </div>

        {backendData && (
          <div className="backend-info">
            <h3>Información del Backend</h3>
            <p>Estado: {backendData.status}</p>
            <p>Tiempo activo: {Math.round(backendData.uptime)}s</p>
            <p>Última actualización: {new Date(backendData.timestamp).toLocaleString()}</p>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
