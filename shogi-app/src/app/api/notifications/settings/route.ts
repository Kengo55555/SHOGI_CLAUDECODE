import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

/** 通知設定取得 */
export async function GET() {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const settings = await prisma.notificationSettings.findUnique({
    where: { userId: user!.id },
  });

  return Response.json({
    emailEnabled: settings?.emailEnabled ?? false,
    siteEnabled: settings?.siteEnabled ?? true,
    lineEnabled: settings?.lineEnabled ?? false,
    slackEnabled: settings?.slackEnabled ?? false,
  });
}

/** 通知設定更新 */
export async function PATCH(request: NextRequest) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const body = await request.json();

  // 許可するフィールドのみ抽出
  const allowedFields = ['emailEnabled', 'siteEnabled'] as const;
  const updateData: Record<string, boolean> = {};

  for (const field of allowedFields) {
    if (typeof body[field] === 'boolean') {
      updateData[field] = body[field];
    }
  }

  const settings = await prisma.notificationSettings.upsert({
    where: { userId: user!.id },
    update: updateData,
    create: {
      userId: user!.id,
      ...updateData,
    },
  });

  return Response.json({
    emailEnabled: settings.emailEnabled,
    siteEnabled: settings.siteEnabled,
    lineEnabled: settings.lineEnabled,
    slackEnabled: settings.slackEnabled,
  });
}
