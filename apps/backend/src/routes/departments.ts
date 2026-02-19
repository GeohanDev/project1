import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const departmentsRouter = Router();
departmentsRouter.use(authenticate);

departmentsRouter.get('/', async (_req: Request, res: Response) => {
  const departments = await prisma.department.findMany({
    include: {
      _count: { select: { users: true, reportTypes: true, meetingTypes: true } },
    },
    orderBy: { name: 'asc' },
  });
  res.json({ success: true, data: departments });
});

departmentsRouter.get('/:id', async (req: Request, res: Response) => {
  const dept = await prisma.department.findUnique({
    where: { id: req.params.id },
    include: {
      reportTypes: { orderBy: [{ frequency: 'asc' }, { name: 'asc' }] },
      meetingTypes: { orderBy: { name: 'asc' } },
      users: {
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: 'asc' },
      },
    },
  });
  if (!dept) throw new AppError(404, 'Department not found');
  res.json({ success: true, data: dept });
});

departmentsRouter.post('/', authorize('SUPER_ADMIN'), async (req: Request, res: Response) => {
  const { name, picName } = req.body;
  if (!name || !picName) throw new AppError(400, 'name and picName required');
  const dept = await prisma.department.create({ data: { name, picName } });
  res.status(201).json({ success: true, data: dept });
});

departmentsRouter.put('/:id', authorize('SUPER_ADMIN'), async (req: Request, res: Response) => {
  const { name, picName } = req.body;
  const dept = await prisma.department.update({
    where: { id: req.params.id },
    data: { name, picName },
  });
  res.json({ success: true, data: dept });
});
