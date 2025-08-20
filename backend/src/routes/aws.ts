import express from 'express';
import { query } from '../config/database';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { AWSService } from '../services/awsService';

const router = express.Router();

// ========================================
// TIPOS
// ========================================

interface CreateAccountRequest {
  accountId: string;
  accountName: string;
  roleArn: string;
  is_active: boolean;
  description?: string;
}

interface CreateGovernanceAccountRequest {
  accountId: string;
  iamUser: string;
  password: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  description?: string;
}

interface AssumeRoleRequest {
  mfaCode?: string;
}

// ========================================
// RUTAS PROTEGIDAS
// ========================================

// GET /api/aws/accounts
router.get('/accounts', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;

    const result = await query(
      `SELECT id, account_id, account_name, role_arn, is_active, created_at, updated_at
       FROM aws_accounts WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error obteniendo cuentas AWS:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// ========================================
// ACCOUNTS
// ========================================

// POST /api/aws/accounts
router.post('/accounts', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { accountId, accountName, roleArn, is_active, description }: CreateAccountRequest = req.body;

    if (!accountId || !accountName || !roleArn) {
      return res.status(400).json({ success: false, error: 'Todos los campos requeridos deben estar presentes' });
    }

    if (!/^\d{12}$/.test(accountId)) {
      return res.status(400).json({ success: false, error: 'Account ID debe tener 12 dígitos' });
    }

    const fullRoleArn = `arn:aws:iam::${accountId}:role/${roleArn}`;

    const existingAccount = await query(
      'SELECT id FROM aws_accounts WHERE user_id = $1 AND account_id = $2',
      [userId, accountId]
    );

    if (existingAccount.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'Esta cuenta AWS ya está registrada' });
    }

    const result = await query(
      `INSERT INTO aws_accounts 
        (user_id, account_id, account_name, role_arn, description, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, account_id, account_name, role_arn, description, created_at`,
      [userId, accountId, accountName, fullRoleArn, description || null, is_active]
    );

    return res.status(201).json({ success: true, message: 'Cuenta AWS creada exitosamente', data: result.rows[0] });
  } catch (error) {
    console.error('Error creando cuenta AWS:', error);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// GET /api/aws/accounts/:id
router.get('/accounts/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const accountId = req.params.id;

    const result = await query(
      `SELECT id, account_id, account_name, role_arn, description, is_active, created_at, updated_at, last_assumed_at, last_error
       FROM aws_accounts WHERE id = $1 AND user_id = $2`,
      [accountId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Cuenta AWS no encontrada' });
    }

    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error obteniendo cuenta AWS:', error);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// PUT /api/aws/accounts/:id
router.put('/accounts/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const accountId = req.params.id;
    const { accountName, roleArn, description, is_active }: CreateAccountRequest = req.body;

    const existingAccount = await query(
      'SELECT id FROM aws_accounts WHERE id = $1 AND user_id = $2',
      [accountId, userId]
    );

    if (existingAccount.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Cuenta AWS no encontrada' });
    }

    const result = await query(
      `UPDATE aws_accounts
       SET account_name = COALESCE($1, account_name),
           role_arn = COALESCE($2, role_arn),
           description = COALESCE($3, description),
           is_active = COALESCE($4, is_active),
           updated_at = NOW()
       WHERE id = $5 AND user_id = $6
       RETURNING id, account_id, account_name, role_arn, description, is_active, updated_at`,
      [accountName, roleArn, description, is_active, accountId, userId]
    );

    return res.json({ success: true, message: 'Cuenta AWS actualizada exitosamente', data: result.rows[0] });
  } catch (error) {
    console.error('Error actualizando cuenta AWS:', error);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// DELETE /api/aws/accounts/:id
router.delete('/accounts/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const accountId = req.params.id;

    const existingAccount = await query(
      'SELECT id FROM aws_accounts WHERE id = $1 AND user_id = $2',
      [accountId, userId]
    );

    if (existingAccount.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Cuenta AWS no encontrada' });
    }

    await query('DELETE FROM aws_accounts WHERE id = $1 AND user_id = $2', [accountId, userId]);

    return res.json({ success: true, message: 'Cuenta AWS eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando cuenta AWS:', error);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// POST /api/aws/accounts/:id/assume-role
router.post('/accounts/:id/assume-role', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const accountId = req.params.id;
    const { mfaCode }: AssumeRoleRequest = req.body;

    const accountResult = await query(
      'SELECT * FROM aws_accounts WHERE id = $1 AND user_id = $2',
      [accountId, userId]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Cuenta AWS no encontrada' });
    }

    const account = accountResult.rows[0];

    try {
      const awsService = new AWSService({ roleArn: account.role_arn, mfaCode, region: 'us-east-1' }); // Agregar región
      const credentials = await awsService.assumeRole();
      const identity = await awsService.getCallerIdentity();

      await query('UPDATE aws_accounts SET last_assumed_at = NOW(), last_error = NULL WHERE id = $1', [accountId]);

      return res.json({
        success: true,
        message: 'Rol asumido exitosamente',
        data: {
          credentials: {
            accessKeyId: credentials.AccessKeyId,
            secretAccessKey: credentials.SecretAccessKey,
            sessionToken: credentials.SessionToken,
            expiration: credentials.Expiration
          },
          identity
        }
      });
    } catch (awsError) {
      const msg = awsError instanceof Error ? awsError.message : String(awsError);
      await query('UPDATE aws_accounts SET last_error = $1 WHERE id = $2', [msg, accountId]);

      return res.status(400).json({ success: false, error: 'Error al asumir rol: ' + msg });
    }
  } catch (error) {
    console.error('Error asumiendo rol:', error);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// GET /api/aws/accounts/:id/test-connection
router.get('/accounts/:id/test-connection', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const accountId = req.params.id;

    const accountResult = await query(
      'SELECT * FROM aws_accounts WHERE id = $1 AND user_id = $2',
      [accountId, userId]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Cuenta AWS no encontrada' });
    }

    const account = accountResult.rows[0];

    try {
      const awsService = new AWSService({ roleArn: account.role_arn, region: 'us-east-1' }); // Agregar región
      const identity = await awsService.getCallerIdentity();

      return res.json({
        success: true,
        message: 'Conexión exitosa',
        data: {
          accountId: identity.Account,
          userId: identity.UserId,
          arn: identity.Arn
        }
      });
    } catch (awsError) {
      const errorMessage = awsError instanceof Error ? awsError.message : 'Error desconocido al conectar con AWS';
      return res.status(400).json({ success: false, error: `Error de conexión: ${errorMessage}` });
    }
  } catch (error) {
    console.error('Error probando conexión:', error);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// ========================================
// GOBERNANZA
// ========================================

router.get('/governance', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;

    const result = await query(
      `SELECT id, account_id, iam_user, aws_access_key_id, aws_secret_access_key, created_at, updated_at, description, password
       FROM governance_account WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error obteniendo cuentas de gobernanza:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// POST /api/aws/governance
router.post('/governance', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { accountId, iamUser, awsAccessKeyId, awsSecretAccessKey, description, password }: CreateGovernanceAccountRequest = req.body;

    if (!accountId || !iamUser || !awsAccessKeyId || !awsSecretAccessKey || !password) {
      return res.status(400).json({ success: false, error: 'Todos los campos requeridos deben estar presentes' });
    }

    const existingAccount = await query(
      'SELECT id FROM governance_account WHERE user_id = $1 AND account_id = $2',
      [userId, accountId]
    );

    if (existingAccount.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'Esta cuenta de gobernanza ya está registrada' });
    }

    const result = await query(
      `INSERT INTO governance_account 
        (user_id, account_id, iam_user, aws_access_key_id, aws_secret_access_key, description, password) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, account_id, iam_user, aws_access_key_id, aws_secret_access_key, created_at`,
      [userId, accountId, iamUser, awsAccessKeyId, awsSecretAccessKey, description || null, password]
    );

    return res.status(201).json({ success: true, message: 'Cuenta de gobernanza creada exitosamente', data: result.rows[0] });
  } catch (error) {
    console.error('Error creando cuenta de gobernanza:', error);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// POST /api/aws/governance/accounts/:id
router.post('/governance/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const accountId = req.params.id;
    const { iamUser, awsAccessKeyId, awsSecretAccessKey, description, password }: CreateGovernanceAccountRequest = req.body;

    if (!iamUser || !awsAccessKeyId || !awsSecretAccessKey || !password) {
      return res.status(400).json({ success: false, error: 'Todos los campos requeridos deben estar presentes' });
    }

    const existingAccount = await query(
      'SELECT id FROM governance_account WHERE user_id = $1 AND account_id = $2',
      [userId, accountId]
    );

    if (existingAccount.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'Esta cuenta de gobernanza ya está registrada' });
    }

    const result = await query(
      `INSERT INTO governance_account 
        (user_id, account_id, iam_user, aws_access_key_id, aws_secret_access_key, description, password) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, account_id, iam_user, aws_access_key_id, aws_secret_access_key, created_at`,
      [userId, accountId, iamUser, awsAccessKeyId, awsSecretAccessKey, description || null, password]
    );

    return res.status(201).json({ success: true, message: 'Cuenta de gobernanza creada exitosamente', data: result.rows[0] });
  } catch (error) {
    console.error('Error creando cuenta de gobernanza:', error);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// GET /api/governance/accounts/:id
router.get('/governance/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const accountId = req.params.id;

    const result = await query(
      `SELECT id, account_id, iam_user, aws_access_key_id, aws_secret_access_key, description, password, created_at, updated_at
       FROM governance_account WHERE id = $1 AND user_id = $2`,
      [accountId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Cuenta de gobernanza no encontrada' });
    }

    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error obteniendo cuenta de gobernanza:', error);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// PUT /api/governance/accounts/:id
router.put('/governance/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const accountId = req.params.id;
    const { iamUser, awsAccessKeyId, awsSecretAccessKey, description, password }: CreateGovernanceAccountRequest = req.body;

    const existingAccount = await query(
      'SELECT id FROM governance_account WHERE id = $1 AND user_id = $2',
      [accountId, userId]
    );

    if (existingAccount.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Cuenta de gobernanza no encontrada' });
    }

    const result = await query(
      `UPDATE governance_account
       SET iam_user = COALESCE($1, iam_user),
           aws_access_key_id = COALESCE($2, aws_access_key_id),
           aws_secret_access_key = COALESCE($3, aws_secret_access_key),
           description = COALESCE($4, description),
           password = COALESCE($5, password),
           updated_at = NOW()
       WHERE id = $6 AND user_id = $7
       RETURNING id, account_id, iam_user, aws_access_key_id, aws_secret_access_key, description, password, updated_at`,
      [iamUser, awsAccessKeyId, awsSecretAccessKey, description, password, accountId, userId]
    );

    return res.json({ success: true, message: 'Cuenta de gobernanza actualizada exitosamente', data: result.rows[0] });
  } catch (error) {
    console.error('Error actualizando cuenta de gobernanza:', error);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// DELETE /api/aws/governance/:id
router.delete('/governance/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const accountId = req.params.id;

    const existingAccount = await query(
      'SELECT id FROM governance_account WHERE id = $1 AND user_id = $2',
      [accountId, userId]
    );

    if (existingAccount.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Cuenta de gobernanza no encontrada' });
    }

    await query('DELETE FROM governance_account WHERE id = $1 AND user_id = $2', [accountId, userId]);

    return res.json({ success: true, message: 'Cuenta de gobernanza eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando cuenta de gobernanza:', error);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

export default router;
