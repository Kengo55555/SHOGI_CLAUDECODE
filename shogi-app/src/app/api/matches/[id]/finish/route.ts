import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, createErrorResponse } from '@/lib/auth';

/** 対局結果を保存 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { id } = await params;
  const body = await request.json();
  const {
    playerWon,      // true=ユーザー勝ち, false=CPU/相手勝ち, null=引き分け
    resultType,
    totalMoves,
    senteTimeUsed,
    goteTimeUsed,
    kifuKif,
    movesJson,
  } = body;

  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) return createErrorResponse('MATCH_NOT_FOUND', '対局が見つかりません', 404);
  if (match.senteId !== user!.id && match.goteId !== user!.id) {
    return createErrorResponse('MATCH_NOT_FOUND', '対局が見つかりません', 404);
  }
  // 既に終了済みなら重複保存しない
  if (match.status === 'finished') {
    return Response.json({ success: true, alreadySaved: true });
  }

  // winnerId の決定
  let winnerId: string | null = null;
  if (playerWon === true) {
    winnerId = user!.id;
  }
  // playerWon === false → CPU勝ち or 相手勝ち → winnerId = null (CPU) or 相手ID
  // playerWon === null → 引き分け → winnerId = null

  const status = resultType === 'aborted' ? 'aborted' : 'finished';

  await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id },
      data: {
        status,
        winnerId,
        resultType,
        totalMoves: totalMoves || 0,
        senteTimeUsed: senteTimeUsed || 0,
        goteTimeUsed: goteTimeUsed || 0,
        endedAt: new Date(),
      },
    });

    if (kifuKif && movesJson) {
      await tx.gameRecord.upsert({
        where: { matchId: id },
        update: { kifuKif, movesJson },
        create: { matchId: id, kifuKif, movesJson },
      });
    }
  });

  return Response.json({ success: true });
}
