import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { AuthUser, Role } from '@reporthub/shared';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError(401, 'Unauthorized');
  }
  const token = authHeader.slice(7);
  try {
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const payload = jwt.verify(token, secret) as AuthUser;
    req.user = payload;
    next();
  } catch {
    throw new AppError(401, 'Invalid or expired token');
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new AppError(401, 'Unauthorized');
    if (!roles.includes(req.user.role)) {
      throw new AppError(403, 'Forbidden');
    }
    next();
  };
}

export function requireDepartment(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  if (!req.user.departmentId && req.user.role !== 'SUPER_ADMIN') {
    throw new AppError(403, 'No department assigned');
  }
  next();
}
