import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { JWTService, JWTPayload } from '../../config/jwt';
import { prisma } from '../../config/database';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload & {
    id: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Access token is required',
      });
      return;
    }

    const token = authHeader.substring(7);
    const payload = JWTService.verifyAccessToken(token);

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        isEmailVerified: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not found',
      });
      return;
    }

    req.user = {
      ...payload,
      id: user.id,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
};

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};