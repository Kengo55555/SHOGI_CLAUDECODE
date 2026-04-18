import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, createErrorResponse } from '@/lib/auth';

/** CPU対戦開始 */
export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const body = await request.json();
  const { cpuLevel, timeControl, playerSente } = body;

  if (![1, 2, 3].includes(cpuLevel)) {
    return createErrorResponse('VALIDATION_ERROR', 'CPUレベルは1〜3で指定してください', 400);
  }
  if (![10, 15].includes(timeControl)) {
    return createErrorResponse('VALIDATION_ERROR', '持ち時間は10分または15分を指定してください', 400);
  }

  // 先手/後手の決定
  const isSente = playerSente === undefined ? Math.random() < 0.5 : !!playerSente;

  const match = await prisma.match.create({
    data: {
      senteId: user!.id,   // CPU対戦ではsenteIdに常にユーザーを設定
      goteId: null,         // CPU
      cpuLevel,
      timeControl,
    },
  });

  return Response.json({
    matchId: match.id,
    userId: user!.id,
    playerSide: isSente ? 'sente' : 'gote',
    cpuLevel,
    timeControl,
  }, { status: 201 });
}
