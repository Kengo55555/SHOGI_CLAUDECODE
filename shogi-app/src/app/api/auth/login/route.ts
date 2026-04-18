import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { hashToken, generateToken } from '@/lib/auth';
import { checkRateLimit, RATE_LIMITS } from '@/lib/utils';

export async function POST(request: NextRequest) {
  // レート制限
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const rateCheck = checkRateLimit({
    key: `auth:${ip}`,
    ...RATE_LIMITS.AUTH,
  });
  if (!rateCheck.allowed) {
    return Response.json(
      { error: { code: 'RATE_LIMITED', message: 'リクエスト制限を超過しました' } },
      { status: 429 }
    );
  }

  const body = await request.json();
  const { email } = body;

  if (!email || typeof email !== 'string') {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'メールアドレスを入力してください' } },
      { status: 400 }
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  // ユーザー存在チェック（アカウント列挙防止のため結果に関係なく同じレスポンス）
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (user && !user.deletedAt) {
    // トークン生成・保存
    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.authToken.create({
      data: {
        email: normalizedEmail,
        tokenHash,
        type: 'login',
        expiresAt,
      },
    });

    // TODO: メール送信
    // const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`;
    // await sendMagicLinkEmail(normalizedEmail, verifyUrl);
  }

  // 常に同じレスポンス
  return Response.json({ message: '確認メールを送信しました' });
}
