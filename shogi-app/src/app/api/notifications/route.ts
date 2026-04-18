import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

/** 通知一覧 */
export async function GET(request: NextRequest) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get('limit') || '20', 10),
    50
  );
  const unreadOnly = request.nextUrl.searchParams.get('unreadOnly') === 'true';
  const cursor = request.nextUrl.searchParams.get('cursor');

  const where = {
    userId: user!.id,
    ...(unreadOnly && { readAt: null }),
  };

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
  });

  const hasMore = notifications.length > limit;
  const items = hasMore ? notifications.slice(0, limit) : notifications;

  const unreadCount = await prisma.notification.count({
    where: { userId: user!.id, readAt: null },
  });

  return Response.json({
    notifications: items.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      referenceId: n.referenceId,
      readAt: n.readAt,
      createdAt: n.createdAt,
    })),
    unreadCount,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
}
