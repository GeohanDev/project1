import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { uploadMeeting } from '../utils/upload';

export const meetingInstancesRouter: Router = Router();
meetingInstancesRouter.use(authenticate);

meetingInstancesRouter.get('/', async (req: Request, res: Response) => {
  const { role, departmentId } = req.user!;
  const { status, departmentId: deptFilter, from, to } = req.query;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (from || to) {
    where.scheduledDate = {
      ...(from ? { gte: new Date(from as string) } : {}),
      ...(to ? { lte: new Date(to as string) } : {}),
    };
  }
  if (role !== 'SUPER_ADMIN') {
    where.meetingType = { departmentId: departmentId ?? undefined };
  } else if (deptFilter) {
    where.meetingType = { departmentId: deptFilter as string };
  }

  const instances = await prisma.meetingInstance.findMany({
    where,
    include: {
      meetingType: { include: { department: { select: { name: true } } } },
      files: true,
    },
    orderBy: { scheduledDate: 'desc' },
  });
  res.json({ success: true, data: instances });
});

meetingInstancesRouter.get('/:id', async (req: Request, res: Response) => {
  const instance = await prisma.meetingInstance.findUnique({
    where: { id: req.params.id as string },
    include: {
      meetingType: { include: { department: { select: { name: true } } } },
      files: true,
    },
  });
  if (!instance) throw new AppError(404, 'Meeting instance not found');
  res.json({ success: true, data: instance });
});

meetingInstancesRouter.post('/', authorize('SUPER_ADMIN', 'HOD', 'PD'), async (req: Request, res: Response) => {
  const { meetingTypeId, scheduledDate, notes } = req.body;
  if (!meetingTypeId || !scheduledDate) throw new AppError(400, 'meetingTypeId and scheduledDate required');

  const instance = await prisma.meetingInstance.create({
    data: {
      meetingTypeId,
      scheduledDate: new Date(scheduledDate),
      notes: notes || null,
    },
    include: { meetingType: { include: { department: { select: { name: true } } } } },
  });
  res.status(201).json({ success: true, data: instance });
});

meetingInstancesRouter.put('/:id', authorize('SUPER_ADMIN', 'HOD', 'PD'), async (req: Request, res: Response) => {
  const { scheduledDate, actualDate, status, notes } = req.body;
  const instance = await prisma.meetingInstance.update({
    where: { id: req.params.id as string },
    data: {
      ...(scheduledDate ? { scheduledDate: new Date(scheduledDate) } : {}),
      ...(actualDate ? { actualDate: new Date(actualDate) } : {}),
      ...(status ? { status } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
    include: { meetingType: { include: { department: { select: { name: true } } } } },
  });
  res.json({ success: true, data: instance });
});

// Upload files to a meeting instance
meetingInstancesRouter.post('/:id/files', uploadMeeting.array('files', 10), async (req: Request, res: Response) => {
  const { fileType } = req.body;
  const files = (req.files as Express.Multer.File[]) || [];
  if (!files.length) throw new AppError(400, 'No files provided');

  const instance = await prisma.meetingInstance.findUnique({ where: { id: req.params.id as string } });
  if (!instance) throw new AppError(404, 'Meeting instance not found');

  const created = await Promise.all(
    files.map((f) =>
      prisma.meetingFile.create({
        data: {
          meetingInstanceId: instance.id,
          fileType: fileType || 'DOCUMENT',
          filename: f.originalname,
          storedName: f.filename,
          mimeType: f.mimetype,
          size: f.size,
        },
      }),
    ),
  );
  res.status(201).json({ success: true, data: created });
});

// Download meeting file
meetingInstancesRouter.get('/files/:instanceId/:storedName', async (req: Request, res: Response) => {
  const { instanceId, storedName } = req.params as Record<string, string>;
  const file = await prisma.meetingFile.findFirst({
    where: { meetingInstanceId: instanceId, storedName },
  });
  if (!file) throw new AppError(404, 'File not found');

  const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
  const filePath = path.resolve(UPLOAD_DIR, 'meetings', file.storedName);
  if (!fs.existsSync(filePath)) throw new AppError(404, 'File not found on disk');

  res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
  res.setHeader('Content-Type', file.mimeType);
  res.sendFile(filePath);
});
