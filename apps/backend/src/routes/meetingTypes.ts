import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const meetingTypesRouter = Router();
meetingTypesRouter.use(authenticate);

meetingTypesRouter.get('/', async (req: Request, res: Response) => {
  const { departmentId: deptFilter } = req.query;
  const { role, departmentId } = req.user!;

  const where = {
    isActive: true,
    departmentId: role === 'SUPER_ADMIN'
      ? (deptFilter as string | undefined)
      : (departmentId ?? undefined),
  };

  const meetingTypes = await prisma.meetingType.findMany({
    where,
    include: { department: { select: { name: true } } },
    orderBy: [{ department: { name: 'asc' } }, { name: 'asc' }],
  });
  res.json({ success: true, data: meetingTypes });
});

meetingTypesRouter.get('/:id', async (req: Request, res: Response) => {
  const mt = await prisma.meetingType.findUnique({
    where: { id: req.params.id },
    include: {
      department: { select: { name: true } },
      meetingInstances: {
        orderBy: { scheduledDate: 'desc' },
        take: 10,
      },
    },
  });
  if (!mt) throw new AppError(404, 'Meeting type not found');
  res.json({ success: true, data: mt });
});

meetingTypesRouter.post('/', authorize('SUPER_ADMIN', 'HOD'), async (req: Request, res: Response) => {
  const { name, departmentId, frequency, description } = req.body;
  if (!name || !departmentId || !frequency) throw new AppError(400, 'name, departmentId, frequency required');
  const mt = await prisma.meetingType.create({
    data: { name, departmentId, frequency, description: description || null },
    include: { department: { select: { name: true } } },
  });
  res.status(201).json({ success: true, data: mt });
});

meetingTypesRouter.put('/:id', authorize('SUPER_ADMIN', 'HOD'), async (req: Request, res: Response) => {
  const { name, description, frequency, isActive } = req.body;
  const mt = await prisma.meetingType.update({
    where: { id: req.params.id },
    data: { name, description, frequency, isActive },
    include: { department: { select: { name: true } } },
  });
  res.json({ success: true, data: mt });
});
