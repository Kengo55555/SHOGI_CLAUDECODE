import { prisma } from '@/lib/db';
import { requireAuth, createErrorResponse } from '@/lib/auth';

/** 対局情報取得 */
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
    },
  });

  if (!match) {
    return createErrorResponse('MATCH_NOT_FOUND', '対局が見つかりません', 404);
  }

  // アクセス権チェック（対局者のみ）
  if (match.senteId !== user!.id && match.goteId !== user!.id) {
    return createErrorResponse('MATCH_NOT_FOUND', '対局が見つかりません', 404);
  }

  return Response.json({
    id: match.id,
    sente: match.sente,
    gote: match.gote,
    cpuLevel: match.cpuLevel,
    timeControl: match.timeControl,
    status: match.status,
    winnerId: match.winnerId,
    resultType: match.resultType,
    totalMoves: match.totalMoves,
    startedAt: match.startedAt,
    endedAt: match.endedAt,
  });
}
