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
  region: string;
  description?: string;
}

interface AssumeRoleRequest {
  mfaCode?: string;
}

// ========================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ========================================

// GET /api/aws/accounts - Obtener todas las cuentas del usuario
router.get('/accounts', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;

    const result = await query(
      `SELECT 
        id, account_id, account_name, role_arn, region, description, 
        is_active, created_at, updated_at,
        last_assumed_at, last_error
      FROM aws_accounts 
      WHERE user_id = $1 
      ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error obteniendo cuentas AWS:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/aws/accounts - Crear nueva cuenta AWS
router.post('/accounts', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { accountId, accountName, roleArn, region, description }: CreateAccountRequest = req.body;

    // Validaciones
    if (!accountId || !accountName || !roleArn || !region) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos requeridos deben estar presentes'
      });
    }

    // Validar formato del Account ID
    if (!/^\d{12}$/.test(accountId)) {
      return res.status(400).json({
        success: false,
        error: 'Account ID debe tener 12 dígitos'
      });
    }

    // Validar formato del Role ARN
    if (!roleArn.startsWith('arn:aws:iam::')) {
      return res.status(400).json({
        success: false,
        error: 'Role ARN debe tener un formato válido'
      });
    }

    // Verificar si la cuenta ya existe para este usuario
    const existingAccount = await query(
      'SELECT id FROM aws_accounts WHERE user_id = $1 AND account_id = $2',
      [userId, accountId]
    );

    if (existingAccount.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Esta cuenta AWS ya está registrada'
      });
    }

    // Crear la cuenta
    const result = await query(
      `INSERT INTO aws_accounts 
        (user_id, account_id, account_name, role_arn, region, description, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, true) 
       RETURNING id, account_id, account_name, role_arn, region, description, created_at`,
      [userId, accountId, accountName, roleArn, region, description || null]
    );

    const account = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Cuenta AWS creada exitosamente',
      data: account
    });

    return res.status(201).json({
      success: true,
      message: 'Cuenta AWS creada exitosamente',
      data: account
    });

  } catch (error) {
    console.error('Error creando cuenta AWS:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/aws/accounts/:id - Obtener cuenta específica
router.get('/accounts/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const accountId = req.params.id;

    const result = await query(
      `SELECT 
        id, account_id, account_name, role_arn, region, description, 
        is_active, created_at, updated_at, last_assumed_at, last_error
      FROM aws_accounts 
      WHERE id = $1 AND user_id = $2`,
      [accountId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cuenta AWS no encontrada'
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Cuenta AWS creada exitosamente',
      data: accountId
    });

  } catch (error) {
    console.error('Error obteniendo cuenta AWS:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/aws/accounts/:id - Actualizar cuenta
router.put('/accounts/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const accountId = req.params.id;
    const { accountName, roleArn, region, description, isActive } = req.body;

    // Verificar que la cuenta existe y pertenece al usuario
    const existingAccount = await query(
      'SELECT id FROM aws_accounts WHERE id = $1 AND user_id = $2',
      [accountId, userId]
    );

    if (existingAccount.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cuenta AWS no encontrada'
      });
    }

    // Actualizar la cuenta
    const result = await query(
      `UPDATE aws_accounts 
       SET account_name = COALESCE($1, account_name),
           role_arn = COALESCE($2, role_arn),
           region = COALESCE($3, region),
           description = COALESCE($4, description),
           is_active = COALESCE($5, is_active),
           updated_at = NOW()
       WHERE id = $6 AND user_id = $7
       RETURNING id, account_id, account_name, role_arn, region, description, is_active, updated_at`,
      [accountName, roleArn, region, description, isActive, accountId, userId]
    );

    return res.json({
      success: true,
      message: 'Cuenta AWS actualizada exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error actualizando cuenta AWS:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/aws/accounts/:id - Eliminar cuenta
router.delete('/accounts/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const accountId = req.params.id;

    // Verificar que la cuenta existe y pertenece al usuario
    const existingAccount = await query(
      'SELECT id FROM aws_accounts WHERE id = $1 AND user_id = $2',
      [accountId, userId]
    );

    if (existingAccount.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cuenta AWS no encontrada'
      });
    }

    // Eliminar la cuenta
    await query(
      'DELETE FROM aws_accounts WHERE id = $1 AND user_id = $2',
      [accountId, userId]
    );

    return res.json({
      success: true,
      message: 'Cuenta AWS eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando cuenta AWS:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/aws/accounts/:id/assume-role - Asumir rol en la cuenta
router.post('/accounts/:id/assume-role', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const accountId = req.params.id;
    const { mfaCode }: AssumeRoleRequest = req.body;

    // Obtener la cuenta
    const accountResult = await query(
      'SELECT * FROM aws_accounts WHERE id = $1 AND user_id = $2',
      [accountId, userId]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cuenta AWS no encontrada'
      });
    }

    const account = accountResult.rows[0];

    try {
      // Intentar asumir el rol
      const awsService = new AWSService({
        region: account.region,
        roleArn: account.role_arn,
        mfaCode
      });

      const credentials = await awsService.assumeRole();
      const identity = await awsService.getCallerIdentity();

      // Actualizar último acceso exitoso
      await query(
        'UPDATE aws_accounts SET last_assumed_at = NOW(), last_error = NULL WHERE id = $1',
        [accountId]
      );

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
      // Actualizar error
      const msg = awsError instanceof Error ? awsError.message : String(awsError);
      await query(
        'UPDATE aws_accounts SET last_error = $1 WHERE id = $2',
        [msg, accountId]
      );

      return res.status(400).json({
        success: false,
        error: 'Error al asumir rol: ' + msg
      });
    }

  } catch (error) {
    console.error('Error asumiendo rol:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
    
  } 

  
});

// GET /api/aws/accounts/:id/test-connection - Probar conexión
router.get('/accounts/:id/test-connection', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const accountId = req.params.id;

    // Obtener la cuenta
    const accountResult = await query(
      'SELECT * FROM aws_accounts WHERE id = $1 AND user_id = $2',
      [accountId, userId]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cuenta AWS no encontrada'
      });
    }

    const account = accountResult.rows[0];

    try {
      // Probar conexión
      const awsService = new AWSService({
        region: account.region,
        roleArn: account.role_arn
      });

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
      return res.status(400).json({
        success: false,
        error: `Error de conexión: ${errorMessage}`
      });
    }

  } catch (error) {
    console.error('Error probando conexión:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

export default router;
