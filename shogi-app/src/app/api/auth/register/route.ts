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

  // メールアドレスのバリデーション
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'メールアドレスの形式が正しくありません' } },
      { status: 400 }
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  // 既存ユーザーチェック
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // トークン生成
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15分

  await prisma.authToken.create({
    data: {
      email: normalizedEmail,
      tokenHash,
      type: existingUser ? 'login' : 'register',
      expiresAt,
    },
  });

  // MVP: メール送信の代わりに認証リンクをレスポンスに含める
  // 本番ではSendGrid等でメール送信し、verifyUrlをレスポンスから削除すること
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const verifyUrl = `${appUrl}/verify?token=${token}`;

  return Response.json({ message: '確認メールを送信しました', verifyUrl });
}
