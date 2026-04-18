import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, createErrorResponse, destroyAllSessions } from '@/lib/auth';

export async function GET() {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  return Response.json({
    id: user!.id,
    handleName: user!.handleName,
    email: user!.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // マスキング
    createdAt: user!.createdAt,
  });
}

export async function PATCH(request: NextRequest) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const body = await request.json();
  const { handleName } = body;

  // バリデーション
  if (!handleName || typeof handleName !== 'string') {
    return createErrorResponse('VALIDATION_ERROR', 'ハンドルネームを入力してください', 400);
  }

  const trimmed = handleName.trim();
  if (trimmed.length < 1 || trimmed.length > 20) {
    return createErrorResponse('VALIDATION_ERROR', 'ハンドルネームは1〜20文字で入力してください', 400);
  }

  const updated = await prisma.user.update({
    where: { id: user!.id },
    data: { handleName: trimmed },
  });

  return Response.json({
    id: updated.id,
    handleName: updated.handleName,
  });
}

export async function DELETE() {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  // 進行中の対局がないか確認
  const activeMatch = await prisma.match.findFirst({
    where: {
      status: 'playing',
      OR: [
        { senteId: user!.id },
        { goteId: user!.id },
      ],
    },
  });

  if (activeMatch) {
    return createErrorResponse('VALIDATION_ERROR', '進行中の対局があるため退会できません', 400);
  }

  await prisma.$transaction(async (tx) => {
    // 論理削除
    await tx.user.update({
      where: { id: user!.id },
      data: {
        deletedAt: new Date(),
        handleName: '退会済みユーザー',
      },
    });

    // 全セッション削除
    await tx.session.deleteMany({ where: { userId: user!.id } });

    // 募集キャンセル
    await tx.matchRequest.updateMany({
      where: { requesterId: user!.id, status: 'open' },
      data: { status: 'cancelled' },
    });

    // 通知設定削除
    await tx.notificationSettings.deleteMany({ where: { userId: user!.id } });
  });

  return Response.json({ message: '退会処理が完了しました' });
}
