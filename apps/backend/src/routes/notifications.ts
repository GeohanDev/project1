import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate } from '../middleware/auth';

export const notificationsRouter = Router();
notificationsRouter.use(authenticate);

notificationsRouter.get('/', async (req: Request, res: Response) => {
  const { unreadOnly } = req.query;
  const notifications = await prisma.notification.findMany({
    where: {
      userId: req.user!.id,
      ...(unreadOnly === 'true' ? { isRead: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const unreadCount = await prisma.notification.count({
    where: { userId: req.user!.id, isRead: false },
  });
  res.json({ success: true, data: { notifications, unreadCount } });
});

notificationsRouter.put('/:id/read', async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data: { isRead: true },
  });
  res.json({ success: true });
});

notificationsRouter.put('/read-all', async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, isRead: false },
    data: { isRead: true },
  });
  res.json({ success: true });
});
