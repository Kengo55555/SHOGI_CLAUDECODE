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
  const { winnerId, resultType, totalMoves, senteTimeUsed, goteTimeUsed, kifuKif, movesJson } = body;

  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) return createErrorResponse('MATCH_NOT_FOUND', '対局が見つかりません', 404);
  if (match.senteId !== user!.id && match.goteId !== user!.id) {
    return createErrorResponse('MATCH_NOT_FOUND', '対局が見つかりません', 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id },
      data: {
        status: 'finished',
        winnerId: winnerId || null,
        resultType,
        totalMoves,
        senteTimeUsed,
        goteTimeUsed,
        endedAt: new Date(),
      },
    });

    await tx.gameRecord.upsert({
      where: { matchId: id },
      update: { kifuKif, movesJson },
      create: { matchId: id, kifuKif, movesJson },
    });
  });

  return Response.json({ success: true });
}
