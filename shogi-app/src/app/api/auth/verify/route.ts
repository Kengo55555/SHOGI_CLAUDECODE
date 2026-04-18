import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { hashToken, createSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'トークンが指定されていません' } },
      { status: 400 }
    );
  }

  const tokenHash = hashToken(token);

  // トークン検索・検証
  const authToken = await prisma.authToken.findFirst({
    where: { tokenHash, used: false },
  });

  if (!authToken) {
    return Response.json(
      { error: { code: 'AUTH_INVALID', message: 'リンクが無効です' } },
      { status: 400 }
    );
  }

  if (authToken.expiresAt < new Date()) {
    return Response.json(
      { error: { code: 'AUTH_INVALID', message: 'リンクの有効期限が切れています' } },
      { status: 400 }
    );
  }

  // トークンを使用済みに更新
  await prisma.authToken.update({
    where: { id: authToken.id },
    data: { used: true },
  });

  let userId: string;

  if (authToken.type === 'register') {
    // 新規ユーザー作成
    const user = await prisma.user.create({
      data: {
        email: authToken.email,
        handleName: `将棋ユーザー${Date.now().toString(36).slice(-4)}`,
      },
    });

    // 通知設定を初期化
    await prisma.notificationSettings.create({
      data: { userId: user.id },
    });

    userId = user.id;
  } else {
    // 既存ユーザーのログイン
    const user = await prisma.user.findUnique({
      where: { email: authToken.email },
    });

    if (!user || user.deletedAt) {
      return Response.json(
        { error: { code: 'USER_NOT_FOUND', message: 'ユーザーが見つかりません' } },
        { status: 404 }
      );
    }

    userId = user.id;
  }

  // セッション発行
  await createSession(userId);

  // ダッシュボードへリダイレクト
  return Response.redirect(new URL('/dashboard', request.nextUrl.origin));
}
