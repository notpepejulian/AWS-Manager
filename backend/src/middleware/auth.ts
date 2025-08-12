import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ========================================
// TIPOS
// ========================================

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    name: string;
  };
}

// ========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ========================================

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Token de acceso requerido'
    });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as {
      userId: string;
      email: string;
      name: string;
    };

    req.user = decoded;
    next();
    return;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({
        success: false,
        error: 'Token inválido'
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expirado'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Error al verificar token'
    });
    return;
  }
};

// ========================================
// MIDDLEWARE OPCIONAL (para rutas que pueden ser públicas o privadas)
// ========================================

export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next(); // Continuar sin autenticación
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as {
      userId: string;
      email: string;
      name: string;
    };

    req.user = decoded;
    next();
    return;
  } catch (error) {
    // Si hay error con el token, continuar sin autenticación
    next();
    return;
  }
};

// ========================================
// MIDDLEWARE DE ROLES (para futuras implementaciones)
// ========================================

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Autenticación requerida'
      });
      return;
    }

    // TODO: Implementar verificación de roles cuando se agregue la tabla de roles
    // Por ahora, permitimos acceso a todos los usuarios autenticados
    next();
    return;
  };
};

// ========================================
// MIDDLEWARE DE RATE LIMITING (para futuras implementaciones)
// ========================================

export const rateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    const userRequests = requests.get(ip);

    if (!userRequests || now > userRequests.resetTime) {
      requests.set(ip, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (userRequests.count >= maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.'
      });
      return;
    }

    userRequests.count++;
    next();
    return;
  };
};
