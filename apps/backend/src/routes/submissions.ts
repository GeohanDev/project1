import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { uploadSubmission } from '../utils/upload';
import { createNotification } from '../services/notification';
import { getCurrentPeriod } from '../utils/schedule';

export const submissionsRouter = Router();
submissionsRouter.use(authenticate);

// List submission periods (with latest submission status)
submissionsRouter.get('/periods', async (req: Request, res: Response) => {
  const { role, departmentId } = req.user!;
  const { status, departmentId: deptFilter } = req.query;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  if (role !== 'SUPER_ADMIN') {
    where.reportType = { departmentId: departmentId ?? undefined };
  } else if (deptFilter) {
    where.reportType = { departmentId: deptFilter as string };
  }

  const periods = await prisma.submissionPeriod.findMany({
    where,
    include: {
      reportType: { include: { department: { select: { name: true } } } },
      submissions: {
        orderBy: { submittedAt: 'desc' },
        take: 1,
        include: {
          submittedBy: { select: { name: true } },
          approval: { select: { status: true } },
        },
      },
    },
    orderBy: [{ dueDate: 'asc' }, { reportType: { name: 'asc' } }],
  });
  res.json({ success: true, data: periods });
});

// Create submission period manually
submissionsRouter.post('/periods', authorize('SUPER_ADMIN', 'HOD'), async (req: Request, res: Response) => {
  const { reportTypeId } = req.body;
  if (!reportTypeId) throw new AppError(400, 'reportTypeId required');

  const rt = await prisma.reportType.findUnique({ where: { id: reportTypeId } });
  if (!rt) throw new AppError(404, 'Report type not found');

  const period = getCurrentPeriod(rt.frequency as string, rt.cutoffDays);
  if (!period) throw new AppError(400, 'Cannot create period for this frequency');

  const existing = await prisma.submissionPeriod.findFirst({
    where: {
      reportTypeId,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
    },
  });
  if (existing) throw new AppError(409, 'Period already exists');

  const sp = await prisma.submissionPeriod.create({
    data: {
      reportTypeId,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      dueDate: period.dueDate,
    },
    include: { reportType: { include: { department: { select: { name: true } } } } },
  });
  res.status(201).json({ success: true, data: sp });
});

// Submit a report
submissionsRouter.post('/:periodId/submit', uploadSubmission.array('files', 10), async (req: Request, res: Response) => {
  const { periodId } = req.params;
  const { notes } = req.body;
  const files = (req.files as Express.Multer.File[]) || [];

  const period = await prisma.submissionPeriod.findUnique({
    where: { id: periodId },
    include: { reportType: { include: { department: true } } },
  });
  if (!period) throw new AppError(404, 'Submission period not found');

  // Check dept access
  const { role, departmentId, id: userId } = req.user!;
  if (role !== 'SUPER_ADMIN' && period.reportType.departmentId !== departmentId) {
    throw new AppError(403, 'Cannot submit for another department');
  }

  const submission = await prisma.submission.create({
    data: {
      submissionPeriodId: periodId,
      submittedById: userId,
      notes: notes || null,
      status: 'SUBMITTED',
      files: {
        create: files.map((f) => ({
          filename: f.originalname,
          storedName: f.filename,
          mimeType: f.mimetype,
          size: f.size,
        })),
      },
    },
    include: {
      files: true,
      submittedBy: { select: { name: true } },
    },
  });

  // Update period status
  await prisma.submissionPeriod.update({
    where: { id: periodId },
    data: { status: 'SUBMITTED' },
  });

  // Auto-approve if HOD or PD submitted
  if (role === 'HOD' || role === 'PD' || role === 'SUPER_ADMIN') {
    await prisma.approval.create({
      data: {
        submissionId: submission.id,
        approverId: userId,
        status: 'APPROVED',
        decidedAt: new Date(),
        comments: 'Auto-approved (submitted by HOD/PD)',
      },
    });
    await prisma.submission.update({ where: { id: submission.id }, data: { status: 'APPROVED' } });
    await prisma.submissionPeriod.update({ where: { id: periodId }, data: { status: 'APPROVED' } });
  } else {
    // Notify HODs/admins
    const hods = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'HOD', departmentId: period.reportType.departmentId },
          { role: 'SUPER_ADMIN' },
        ],
      },
    });
    for (const hod of hods) {
      await createNotification(hod.id, {
        title: 'New submission pending approval',
        message: `${period.reportType.name} has been submitted by ${submission.submittedBy.name} and needs your approval.`,
        type: 'APPROVAL',
        link: `/submissions/${submission.id}`,
      });
    }
  }

  res.status(201).json({ success: true, data: submission });
});

// Get single submission
submissionsRouter.get('/:id', async (req: Request, res: Response) => {
  const submission = await prisma.submission.findUnique({
    where: { id: req.params.id },
    include: {
      submissionPeriod: { include: { reportType: { include: { department: { select: { name: true } } } } } },
      submittedBy: { select: { id: true, name: true, email: true, role: true } },
      files: true,
      approval: { include: { approver: { select: { name: true } } } },
    },
  });
  if (!submission) throw new AppError(404, 'Submission not found');
  res.json({ success: true, data: submission });
});

// Approve / reject submission
submissionsRouter.post('/:id/approve', authorize('SUPER_ADMIN', 'HOD', 'PD'), async (req: Request, res: Response) => {
  const { status, comments } = req.body;
  if (!['APPROVED', 'REJECTED'].includes(status)) throw new AppError(400, 'status must be APPROVED or REJECTED');

  const submission = await prisma.submission.findUnique({
    where: { id: req.params.id },
    include: { submissionPeriod: true, submittedBy: { select: { id: true, name: true } } },
  });
  if (!submission) throw new AppError(404, 'Submission not found');
  if (submission.approval) throw new AppError(409, 'Already decided');

  await prisma.approval.create({
    data: {
      submissionId: submission.id,
      approverId: req.user!.id,
      status,
      comments: comments || null,
      decidedAt: new Date(),
    },
  });

  await prisma.submission.update({
    where: { id: submission.id },
    data: { status },
  });

  if (status === 'APPROVED') {
    await prisma.submissionPeriod.update({
      where: { id: submission.submissionPeriodId },
      data: { status: 'APPROVED' },
    });
  }

  // Notify submitter
  await createNotification(submission.submittedById, {
    title: `Submission ${status === 'APPROVED' ? 'approved' : 'rejected'}`,
    message: `Your submission for ${submission.submissionPeriod.reportTypeId} has been ${status.toLowerCase()}.${comments ? ` Comments: ${comments}` : ''}`,
    type: 'APPROVAL',
    link: `/submissions/${submission.id}`,
  });

  res.json({ success: true, message: `Submission ${status.toLowerCase()}` });
});

// Download file
submissionsRouter.get('/files/:submissionId/:storedName', async (req: Request, res: Response) => {
  const file = await prisma.submissionFile.findFirst({
    where: { submissionId: req.params.submissionId, storedName: req.params.storedName },
  });
  if (!file) throw new AppError(404, 'File not found');

  const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
  const filePath = path.resolve(UPLOAD_DIR, 'submissions', file.storedName);
  if (!fs.existsSync(filePath)) throw new AppError(404, 'File not found on disk');

  res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
  res.setHeader('Content-Type', file.mimeType);
  res.sendFile(filePath);
});
