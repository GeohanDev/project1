import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { AuthUser } from '@reporthub/shared';

export const authRouter: Router = Router();

authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError(400, 'Email and password required');

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { department: { select: { name: true } } },
  });
  if (!user || !user.isActive) throw new AppError(401, 'Invalid credentials');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError(401, 'Invalid credentials');

  const payload: AuthUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as AuthUser['role'],
    departmentId: user.departmentId,
    departmentName: user.department?.name,
  };

  const secret = process.env.JWT_SECRET || 'dev-secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  const token = jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);

  res.json({ success: true, data: { token, user: payload } });
});

authRouter.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true, email: true, name: true, role: true,
      departmentId: true, department: { select: { name: true } },
      isActive: true, createdAt: true,
    },
  });
  if (!user) throw new AppError(404, 'User not found');
  res.json({ success: true, data: user });
});

authRouter.post('/change-password', authenticate, async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new AppError(400, 'Both passwords required');
  if (newPassword.length < 8) throw new AppError(400, 'Password must be at least 8 characters');

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw new AppError(404, 'User not found');

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new AppError(401, 'Current password is incorrect');

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  res.json({ success: true, message: 'Password changed successfully' });
});
