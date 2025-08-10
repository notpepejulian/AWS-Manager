import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
// import { connectDB, initializeTables } from './config/database';

// Cargar variables de entorno
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 4000;

// ========================================
// MIDDLEWARE
// ========================================

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ========================================
// RUTAS BÁSICAS
// ========================================

app.get('/', (req, res) => {
  res.json({
    message: 'AWS Management Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV
  });
});

// ========================================
// RUTAS DE LA API
// ========================================

// TODO: Importar y usar las rutas cuando estén creadas
// app.use('/api/auth', authRoutes);
// app.use('/api/aws', awsRoutes);
// app.use('/api/dashboards', dashboardRoutes);
// app.use('/api/users', userRoutes);

// ========================================
// WEBSOCKET PARA TIEMPO REAL
// ========================================

io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado:', socket.id);

  socket.on('join-account', (accountId: string) => {
    socket.join(`account-${accountId}`);
    console.log(`👤 Usuario ${socket.id} se unió a la cuenta ${accountId}`);
  });

  socket.on('leave-account', (accountId: string) => {
    socket.leave(`account-${accountId}`);
    console.log(`👤 Usuario ${socket.id} salió de la cuenta ${accountId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Cliente desconectado:', socket.id);
  });
});

// Exportar io para usar en otros módulos
export { io };

// ========================================
// MANEJO DE ERRORES
// ========================================

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ========================================
// MANEJO DE RUTAS NO ENCONTRADAS
// ========================================

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// ========================================
// INICIALIZACIÓN DEL SERVIDOR
// ========================================

const startServer = async () => {
  try {
    // Iniciar servidor
    server.listen(PORT, () => {
      console.log('🚀 Servidor iniciado correctamente');
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 API disponible: http://localhost:${PORT}`);
      console.log(`🔌 WebSocket disponible en puerto ${PORT}`);
      console.log(`📝 Entorno: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
    process.exit(1);
  }
};

// ========================================
// MANEJO DE SEÑALES DE TERMINACIÓN
// ========================================

process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Recibida señal SIGINT, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

// ========================================
// MANEJO DE ERRORES NO CAPTURADOS
// ========================================

process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  process.exit(1);
});

// Iniciar el servidor
startServer();
