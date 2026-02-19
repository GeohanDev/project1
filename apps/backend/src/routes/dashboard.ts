import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate } from '../middleware/auth';
import { startOfMonth, endOfMonth } from 'date-fns';

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

dashboardRouter.get('/', async (req: Request, res: Response) => {
  const { role, departmentId } = req.user!;
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const deptFilter = role === 'SUPER_ADMIN'
    ? {}
    : { departmentId: departmentId ?? undefined };

  const [
    totalReportTypes,
    totalMeetingTypes,
    pendingPeriods,
    overduePeriods,
    submittedThisMonth,
    approvedThisMonth,
    pendingApprovals,
    recentSubmissions,
    upcomingDue,
    notificationCount,
  ] = await Promise.all([
    prisma.reportType.count({ where: { ...deptFilter, isActive: true } }),
    prisma.meetingType.count({ where: { ...deptFilter, isActive: true } }),
    prisma.submissionPeriod.count({
      where: { status: 'PENDING', reportType: deptFilter },
    }),
    prisma.submissionPeriod.count({
      where: { status: 'OVERDUE', reportType: deptFilter },
    }),
    prisma.submission.count({
      where: {
        submittedAt: { gte: monthStart, lte: monthEnd },
        submissionPeriod: { reportType: deptFilter },
      },
    }),
    prisma.submission.count({
      where: {
        status: 'APPROVED',
        submittedAt: { gte: monthStart, lte: monthEnd },
        submissionPeriod: { reportType: deptFilter },
      },
    }),
    prisma.approval.count({
      where: {
        status: 'PENDING',
        submission: { submissionPeriod: { reportType: deptFilter } },
      },
    }),
    prisma.submission.findMany({
      where: { submissionPeriod: { reportType: deptFilter } },
      include: {
        submittedBy: { select: { name: true } },
        submissionPeriod: {
          include: { reportType: { include: { department: { select: { name: true } } } } },
        },
        approval: { select: { status: true } },
      },
      orderBy: { submittedAt: 'desc' },
      take: 5,
    }),
    prisma.submissionPeriod.findMany({
      where: {
        status: 'PENDING',
        dueDate: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
        reportType: deptFilter,
      },
      include: { reportType: { include: { department: { select: { name: true } } } } },
      orderBy: { dueDate: 'asc' },
      take: 10,
    }),
    prisma.notification.count({ where: { userId: req.user!.id, isRead: false } }),
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        totalReportTypes,
        totalMeetingTypes,
        pendingPeriods,
        overduePeriods,
        submittedThisMonth,
        approvedThisMonth,
        pendingApprovals,
        notificationCount,
      },
      recentSubmissions,
      upcomingDue,
    },
  });
});

// Department breakdown for admin
dashboardRouter.get('/departments', async (req: Request, res: Response) => {
  const { role } = req.user!;
  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  const departments = await prisma.department.findMany({
    include: {
      _count: { select: { reportTypes: true, meetingTypes: true, users: true } },
    },
    orderBy: { name: 'asc' },
  });

  const deptStats = await Promise.all(
    departments.map(async (dept) => {
      const [pending, overdue, approved] = await Promise.all([
        prisma.submissionPeriod.count({ where: { status: 'PENDING', reportType: { departmentId: dept.id } } }),
        prisma.submissionPeriod.count({ where: { status: 'OVERDUE', reportType: { departmentId: dept.id } } }),
        prisma.submissionPeriod.count({ where: { status: 'APPROVED', reportType: { departmentId: dept.id } } }),
      ]);
      return { ...dept, pending, overdue, approved };
    }),
  );

  res.json({ success: true, data: deptStats });
});
