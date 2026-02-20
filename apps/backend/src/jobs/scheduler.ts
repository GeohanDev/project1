import cron from 'node-cron';
import { prisma } from '../utils/prisma';
import { getCurrentPeriod } from '../utils/schedule';
import { createNotification } from '../services/notification';
import { Frequency } from '@reporthub/shared';

// Generate submission periods for active report types
async function generatePeriods(): Promise<void> {
  const reportTypes = await prisma.reportType.findMany({
    where: { isActive: true, frequency: { not: 'PROJECT_COMPLETION' } },
  });

  for (const rt of reportTypes) {
    const period = getCurrentPeriod(rt.frequency as Frequency, rt.cutoffDays);
    if (!period) continue;

    const existing = await prisma.submissionPeriod.findFirst({
      where: {
        reportTypeId: rt.id,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
      },
    });
    if (existing) continue;

    await prisma.submissionPeriod.create({
      data: {
        reportTypeId: rt.id,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        dueDate: period.dueDate,
        status: 'PENDING',
      },
    });
  }
}

// Mark overdue periods
async function markOverdue(): Promise<void> {
  const now = new Date();
  const overduePeriods = await prisma.submissionPeriod.findMany({
    where: {
      status: 'PENDING',
      dueDate: { lt: now },
    },
    include: {
      reportType: { include: { department: { include: { users: { select: { id: true } } } } } },
    },
  });

  for (const period of overduePeriods) {
    await prisma.submissionPeriod.update({
      where: { id: period.id },
      data: { status: 'OVERDUE' },
    });

    // Notify department users
    for (const user of period.reportType.department.users) {
      await createNotification(user.id, {
        title: 'Report overdue',
        message: `"${period.reportType.name}" submission is now overdue. Due date was ${period.dueDate.toLocaleDateString()}.`,
        type: 'OVERDUE',
        link: '/submissions',
      });
    }
  }
}

// Send reminders for periods due soon (within 2 days)
async function sendReminders(): Promise<void> {
  const now = new Date();
  const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  const dueSoon = await prisma.submissionPeriod.findMany({
    where: {
      status: 'PENDING',
      dueDate: { gte: now, lte: twoDaysFromNow },
    },
    include: {
      reportType: { include: { department: { include: { users: { select: { id: true } } } } } },
    },
  });

  for (const period of dueSoon) {
    const daysLeft = Math.ceil((period.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    for (const user of period.reportType.department.users) {
      // Avoid duplicate reminders: check if we already sent one today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const existing = await prisma.notification.findFirst({
        where: {
          userId: user.id,
          link: '/submissions',
          type: 'REMINDER',
          createdAt: { gte: today },
          message: { contains: period.reportType.name },
        },
      });
      if (existing) continue;

      await createNotification(user.id, {
        title: `Reminder: "${period.reportType.name}" due in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`,
        message: `Your "${period.reportType.name}" report is due on ${period.dueDate.toLocaleDateString()}. Please submit it on time.`,
        type: 'REMINDER',
        link: '/submissions',
      });
    }
  }
}

export function startScheduler(): void {
  const cronOptions = { timezone: 'Asia/Kuala_Lumpur' };

  // Generate periods daily at 1am (UTC+8)
  cron.schedule('0 1 * * *', async () => {
    console.log('[Scheduler] Generating submission periods...');
    await generatePeriods().catch(console.error);
  }, cronOptions);

  // Check overdue every hour
  cron.schedule('0 * * * *', async () => {
    console.log('[Scheduler] Checking overdue periods...');
    await markOverdue().catch(console.error);
  }, cronOptions);

  // Send reminders every day at 8am (UTC+8)
  cron.schedule('0 8 * * *', async () => {
    console.log('[Scheduler] Sending reminders...');
    await sendReminders().catch(console.error);
  }, cronOptions);

  // Run immediately on startup
  generatePeriods().catch(console.error);
  markOverdue().catch(console.error);

  console.log('[Scheduler] Started');
}
