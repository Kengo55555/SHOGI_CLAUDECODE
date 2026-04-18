import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, createErrorResponse } from '@/lib/auth';
import { checkRateLimit, RATE_LIMITS } from '@/lib/utils';

/** 対戦募集一覧 */
export async function GET() {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const requests = await prisma.matchRequest.findMany({
    where: { status: 'open' },
    include: {
      requester: {
        select: { id: true, handleName: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return Response.json({
    requests: requests.map((r) => ({
      id: r.id,
      requester: r.requester,
      timeControl: r.timeControl,
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
    })),
  });
}

/** 対戦募集作成 */
export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  // レート制限
  const rateCheck = checkRateLimit({
    key: `match_request:${user!.id}`,
    ...RATE_LIMITS.MATCH_REQUEST,
  });
  if (!rateCheck.allowed) {
    return createErrorResponse('RATE_LIMITED', 'リクエスト制限を超過しました。しばらく待ってからお試しください', 429);
  }

  // 既存の募集チェック
  const existing = await prisma.matchRequest.findFirst({
    where: { requesterId: user!.id, status: 'open' },
  });
  if (existing) {
    return createErrorResponse('MATCH_REQUEST_EXISTS', '既に対戦募集を発信しています', 409);
  }

  const body = await request.json();
  const { timeControl } = body;

  if (timeControl !== 10 && timeControl !== 15) {
    return createErrorResponse('VALIDATION_ERROR', '持ち時間は10分または15分を指定してください', 400);
  }

  const matchRequest = await prisma.matchRequest.create({
    data: {
      requesterId: user!.id,
      timeControl,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30分後
    },
  });

  // TODO: 全ユーザーへの通知（DD-05で実装）

  return Response.json({
    id: matchRequest.id,
    timeControl: matchRequest.timeControl,
    status: matchRequest.status,
    expiresAt: matchRequest.expiresAt,
  }, { status: 201 });
}
