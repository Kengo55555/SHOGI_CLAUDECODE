import { prisma } from '@/lib/db';
import { requireAuth, createErrorResponse } from '@/lib/auth';

/** 通知を既読にする */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { id } = await params;

  const notification = await prisma.notification.findFirst({
    where: { id, userId: user!.id },
  });

  if (!notification) {
    return createErrorResponse('MATCH_NOT_FOUND', '通知が見つかりません', 404);
  }

  await prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  });

  return Response.json({ success: true });
}
