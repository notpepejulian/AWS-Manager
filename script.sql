-- Habilitar extensión para gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de cuentas AWS
CREATE TABLE IF NOT EXISTS aws_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  account_id VARCHAR(12) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  role_arn VARCHAR(255) NOT NULL,
  region VARCHAR(50) DEFAULT 'us-east-1',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  last_assumed_at TIMESTAMP,
  last_error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, account_id)
);

-- Tabla de sesiones AWS (opcional)
CREATE TABLE IF NOT EXISTS aws_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES aws_accounts(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  mfa_required BOOLEAN DEFAULT false,
  mfa_code VARCHAR(6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de recursos AWS (inventario)
CREATE TABLE IF NOT EXISTS aws_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES aws_accounts(id) ON DELETE CASCADE,
  service VARCHAR(50) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255) NOT NULL,
  resource_name VARCHAR(255),
  region VARCHAR(50) NOT NULL,
  tags JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(account_id, service, resource_type, resource_id, region)
);

-- Tabla de dashboards (opcional)
CREATE TABLE IF NOT EXISTS dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  widgets JSONB DEFAULT '[]'::jsonb,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de logs de auditoría (opcional)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  account_id UUID REFERENCES aws_accounts(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_aws_accounts_user_id ON aws_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_aws_accounts_account_id ON aws_accounts(account_id);
CREATE INDEX IF NOT EXISTS idx_aws_accounts_updated_at ON aws_accounts(updated_at);

CREATE INDEX IF NOT EXISTS idx_aws_sessions_account_id ON aws_sessions(account_id);
CREATE INDEX IF NOT EXISTS idx_aws_sessions_expires_at ON aws_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_aws_resources_account_id ON aws_resources(account_id);
CREATE INDEX IF NOT EXISTS idx_aws_resources_service ON aws_resources(service);
CREATE INDEX IF NOT EXISTS idx_aws_resources_region ON aws_resources(region);

CREATE INDEX IF NOT EXISTS idx_dashboards_user_id ON dashboards(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);