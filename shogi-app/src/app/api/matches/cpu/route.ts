import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, createErrorResponse } from '@/lib/auth';

/** CPU対戦開始 */
export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const body = await request.json();
  const { cpuLevel, timeControl, playerSente } = body;

  // バリデーション
  if (![1, 2, 3].includes(cpuLevel)) {
    return createErrorResponse('VALIDATION_ERROR', 'CPUレベルは1〜3で指定してください', 400);
  }
  if (![10, 15].includes(timeControl)) {
    return createErrorResponse('VALIDATION_ERROR', '持ち時間は10分または15分を指定してください', 400);
  }

  const isSente = playerSente === undefined ? Math.random() < 0.5 : !!playerSente;

  const match = await prisma.match.create({
    data: {
      senteId: isSente ? user!.id : user!.id, // CPU戦はユーザーIDを先手に設定
      cpuLevel,
      timeControl,
    },
  });

  // TODO: 初期GameStateの生成はDD-01で実装

  return Response.json({
    matchId: match.id,
    playerSide: isSente ? 'sente' : 'gote',
    cpuLevel,
    timeControl,
  }, { status: 201 });
}
