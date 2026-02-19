import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const usersRouter = Router();
usersRouter.use(authenticate);

// List users - SUPER_ADMIN sees all, HOD/PD see own dept
usersRouter.get('/', async (req: Request, res: Response) => {
  const { role, departmentId } = req.user!;
  const where = role === 'SUPER_ADMIN'
    ? {}
    : { departmentId: departmentId ?? undefined };

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true, email: true, name: true, role: true,
      departmentId: true, department: { select: { name: true } },
      isActive: true, createdAt: true,
    },
    orderBy: [{ department: { name: 'asc' } }, { name: 'asc' }],
  });
  res.json({ success: true, data: users });
});

// Create user - SUPER_ADMIN only
usersRouter.post('/', authorize('SUPER_ADMIN'), async (req: Request, res: Response) => {
  const { email, name, password, role, departmentId } = req.body;
  if (!email || !name || !password) throw new AppError(400, 'email, name, password required');

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) throw new AppError(409, 'Email already in use');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(), name, passwordHash,
      role: role || 'STAFF',
      departmentId: departmentId || null,
    },
    select: { id: true, email: true, name: true, role: true, departmentId: true, isActive: true },
  });
  res.status(201).json({ success: true, data: user });
});

// Update user - SUPER_ADMIN only
usersRouter.put('/:id', authorize('SUPER_ADMIN'), async (req: Request, res: Response) => {
  const { name, role, departmentId, isActive, password } = req.body;
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (role !== undefined) updateData.role = role;
  if (departmentId !== undefined) updateData.departmentId = departmentId || null;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (password) updateData.passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: updateData,
    select: { id: true, email: true, name: true, role: true, departmentId: true, isActive: true },
  });
  res.json({ success: true, data: user });
});

// Delete user - SUPER_ADMIN only
usersRouter.delete('/:id', authorize('SUPER_ADMIN'), async (req: Request, res: Response) => {
  if (req.params.id === req.user!.id) throw new AppError(400, 'Cannot delete yourself');
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'User deleted' });
});
