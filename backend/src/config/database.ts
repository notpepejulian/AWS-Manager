import { Pool, PoolConfig } from 'pg';
import { DatabaseConfig } from '../types';

// ========================================
// CONFIGURACIÓN DE LA BASE DE DATOS
// ========================================

const dbConfig: DatabaseConfig = {
  host: process.env.POSTGRES_HOST || 'postgres',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'aws_manager',
  username: process.env.POSTGRES_USER || 'user',
  password: process.env.POSTGRES_PASSWORD || 'P@ssw0rd',
  //ssl: process.env.NODE_ENV === 'production'
};

const poolConfig: PoolConfig = {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.username, // <-- aquí mapear "username" a "user"
  password: dbConfig.password,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  maxUses: 7500,
};


// Crear el pool de conexiones
export const pool = new Pool(poolConfig);

// ========================================
// FUNCIONES DE CONEXIÓN
// ========================================

export const connectDB = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    console.log('✅ Base de datos PostgreSQL conectada');
    client.release();
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    process.exit(1);
  }
};

export const closeDB = async (): Promise<void> => {
  try {
    await pool.end();
    console.log('🔌 Conexión a la base de datos cerrada');
  } catch (error) {
    console.error('❌ Error cerrando la conexión a la base de datos:', error);
  }
};

// ========================================
// FUNCIONES DE UTILIDAD PARA QUERIES
// ========================================

export const query = async (text: string, params?: any[]): Promise<any> => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query ejecutada:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Error en query:', { text, params, error });
    throw error;
  }
};

export const getClient = async () => {
  return await pool.connect();
};

// ========================================
// INICIALIZACIÓN DE TABLAS
// ========================================

export const initializeTables = async (): Promise<void> => {
  try {
    // Tabla de usuarios
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de cuentas AWS
    await query(`
      CREATE TABLE IF NOT EXISTS aws_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        account_id VARCHAR(12) NOT NULL,
        account_name VARCHAR(255) NOT NULL,
        role_arn VARCHAR(255) NOT NULL,
        region VARCHAR(50) DEFAULT 'us-east-1',
        is_active BOOLEAN DEFAULT true,
        last_accessed TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, account_id)
      )
    `);

    // Tabla de sesiones AWS
    await query(`
      CREATE TABLE IF NOT EXISTS aws_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id UUID REFERENCES aws_accounts(id) ON DELETE CASCADE,
        session_token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        mfa_required BOOLEAN DEFAULT false,
        mfa_code VARCHAR(6),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de recursos AWS
    await query(`
      CREATE TABLE IF NOT EXISTS aws_resources (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id UUID REFERENCES aws_accounts(id) ON DELETE CASCADE,
        service VARCHAR(50) NOT NULL,
        resource_type VARCHAR(100) NOT NULL,
        resource_id VARCHAR(255) NOT NULL,
        resource_name VARCHAR(255),
        region VARCHAR(50) NOT NULL,
        tags JSONB DEFAULT '{}',
        metadata JSONB DEFAULT '{}',
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(account_id, service, resource_type, resource_id, region)
      )
    `);

    // Tabla de dashboards
    await query(`
      CREATE TABLE IF NOT EXISTS dashboards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        widgets JSONB DEFAULT '[]',
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de logs de auditoría
    await query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        account_id UUID REFERENCES aws_accounts(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(100),
        resource_id VARCHAR(255),
        details JSONB DEFAULT '{}',
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Índices para mejorar el rendimiento
    await query(`
      CREATE INDEX IF NOT EXISTS idx_aws_accounts_user_id ON aws_accounts(user_id);
      CREATE INDEX IF NOT EXISTS idx_aws_accounts_account_id ON aws_accounts(account_id);
      CREATE INDEX IF NOT EXISTS idx_aws_sessions_account_id ON aws_sessions(account_id);
      CREATE INDEX IF NOT EXISTS idx_aws_sessions_expires_at ON aws_sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_aws_resources_account_id ON aws_resources(account_id);
      CREATE INDEX IF NOT EXISTS idx_aws_resources_service ON aws_resources(service);
      CREATE INDEX IF NOT EXISTS idx_aws_resources_region ON aws_resources(region);
      CREATE INDEX IF NOT EXISTS idx_dashboards_user_id ON dashboards(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
    `);

    console.log('✅ Tablas de la base de datos inicializadas correctamente');
  } catch (error) {
    console.error('❌ Error inicializando tablas:', error);
    throw error;
  }
};
