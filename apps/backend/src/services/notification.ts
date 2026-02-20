import { prisma } from '../utils/prisma';

interface CreateNotificationInput {
  title: string;
  message: string;
  type: string;
  link?: string;
}

export async function createNotification(userId: string, input: CreateNotificationInput): Promise<void> {
  await prisma.notification.create({
    data: {
      userId,
      title: input.title,
      message: input.message,
      type: input.type,
      link: input.link || null,
    },
  });
}

export async function notifyDepartmentUsers(
  departmentId: string,
  input: CreateNotificationInput,
  excludeUserId?: string,
): Promise<void> {
  const users = await prisma.user.findMany({
    where: { departmentId, isActive: true, ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}) },
    select: { id: true },
  });
  await Promise.all(users.map((u: { id: string }) => createNotification(u.id, input)));
}

export async function notifyAdmins(input: CreateNotificationInput): Promise<void> {
  const admins = await prisma.user.findMany({
    where: { role: 'SUPER_ADMIN', isActive: true },
    select: { id: true },
  });
  await Promise.all(admins.map((u: { id: string }) => createNotification(u.id, input)));
}
