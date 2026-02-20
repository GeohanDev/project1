import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const reportTypesRouter: Router = Router();
reportTypesRouter.use(authenticate);

reportTypesRouter.get('/', async (req: Request, res: Response) => {
  const { departmentId: deptFilter } = req.query;
  const { role, departmentId } = req.user!;

  const where = {
    isActive: true,
    departmentId: role === 'SUPER_ADMIN'
      ? (deptFilter as string | undefined)
      : (departmentId ?? undefined),
  };

  const reportTypes = await prisma.reportType.findMany({
    where,
    include: { department: { select: { name: true } } },
    orderBy: [{ department: { name: 'asc' } }, { frequency: 'asc' }, { name: 'asc' }],
  });
  res.json({ success: true, data: reportTypes });
});

reportTypesRouter.get('/:id', async (req: Request, res: Response) => {
  const rt = await prisma.reportType.findUnique({
    where: { id: req.params.id as string },
    include: {
      department: { select: { name: true } },
      submissionPeriods: {
        orderBy: { periodStart: 'desc' },
        take: 10,
        include: { _count: { select: { submissions: true } } },
      },
    },
  });
  if (!rt) throw new AppError(404, 'Report type not found');
  res.json({ success: true, data: rt });
});

reportTypesRouter.post('/', authorize('SUPER_ADMIN', 'HOD'), async (req: Request, res: Response) => {
  const { name, departmentId, frequency, description, cutoffDays, toleranceDays } = req.body;
  if (!name || !departmentId || !frequency) throw new AppError(400, 'name, departmentId, frequency required');

  const rt = await prisma.reportType.create({
    data: {
      name, departmentId, frequency,
      description: description || null,
      cutoffDays: cutoffDays ?? 3,
      toleranceDays: toleranceDays ?? 2,
    },
    include: { department: { select: { name: true } } },
  });
  res.status(201).json({ success: true, data: rt });
});

reportTypesRouter.put('/:id', authorize('SUPER_ADMIN', 'HOD'), async (req: Request, res: Response) => {
  const { name, description, cutoffDays, toleranceDays, isActive } = req.body;
  const rt = await prisma.reportType.update({
    where: { id: req.params.id as string },
    data: { name, description, cutoffDays, toleranceDays, isActive },
    include: { department: { select: { name: true } } },
  });
  res.json({ success: true, data: rt });
});
