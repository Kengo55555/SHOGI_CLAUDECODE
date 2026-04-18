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

  let verifyUrl: string | undefined;

  if (user && !user.deletedAt) {
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

    // MVP: 認証リンクをレスポンスに含める
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    verifyUrl = `${appUrl}/verify?token=${token}`;
  }

  return Response.json({ message: '確認メールを送信しました', verifyUrl });
}
