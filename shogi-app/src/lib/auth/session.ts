import { createHash, randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

const SESSION_COOKIE_NAME = 'session_token';
const SESSION_EXPIRY_DAYS = 30;

/** セッショントークンをSHA-256でハッシュ化 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** ランダムなトークンを生成 */
export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/** セッションを作成し、Cookieに設定 */
export async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: expiresAt,
    path: '/',
  });

  return token;
}

/** Cookieからセッションを検証し、ユーザーを返す */
export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    // 期限切れセッションは削除
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    return null;
  }

  // 論理削除されたユーザーは無効
  if (session.user.deletedAt) {
    return null;
  }

  // lastUsedを更新（アクティビティ追跡）
  await prisma.session.update({
    where: { id: session.id },
    data: { lastUsed: new Date() },
  });

  return session.user;
}

/** セッションを削除（ログアウト） */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashToken(token);
    await prisma.session.deleteMany({ where: { tokenHash } });
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}

/** ユーザーの全セッションを削除 */
export async function destroyAllSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}
