import { prisma } from '@/lib/db';
import { requireAuth, createErrorResponse } from '@/lib/auth';

/** 棋譜取得 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      sente: { select: { id: true, handleName: true } },
      gote: { select: { id: true, handleName: true } },
      gameRecord: true,
    },
  });

  if (!match) {
    return createErrorResponse('MATCH_NOT_FOUND', '対局が見つかりません', 404);
  }

  if (!match.gameRecord) {
    return createErrorResponse('MATCH_NOT_FOUND', '棋譜が見つかりません', 404);
  }

  return Response.json({
    matchId: match.id,
    kifText: match.gameRecord.kifuKif,
    moves: match.gameRecord.movesJson,
    metadata: {
      sente: match.sente.handleName,
      gote: match.gote ? match.gote.handleName : `CPU（レベル${match.cpuLevel}）`,
      timeControl: match.timeControl,
      resultType: match.resultType,
      totalMoves: match.totalMoves,
      startedAt: match.startedAt,
    },
  });
}
