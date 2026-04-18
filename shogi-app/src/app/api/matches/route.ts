import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

/** 対局履歴一覧 */
export async function GET(request: NextRequest) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get('limit') || '20', 10),
    50
  );
  const cursor = request.nextUrl.searchParams.get('cursor');

  const matches = await prisma.match.findMany({
    where: {
      status: 'finished',
      OR: [
        { senteId: user!.id },
        { goteId: user!.id },
      ],
    },
    include: {
      sente: { select: { id: true, handleName: true } },
      gote: { select: { id: true, handleName: true } },
    },
    orderBy: { endedAt: 'desc' },
    take: limit + 1, // +1 で次ページ有無を判定
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
  });

  const hasMore = matches.length > limit;
  const items = hasMore ? matches.slice(0, limit) : matches;

  // 集計
  const stats = await prisma.match.groupBy({
    by: ['winnerId'],
    where: {
      status: 'finished',
      OR: [
        { senteId: user!.id },
        { goteId: user!.id },
      ],
    },
    _count: true,
  });

  const totalGames = stats.reduce((sum, s) => sum + s._count, 0);
  const wins = stats.find((s) => s.winnerId === user!.id)?._count || 0;
  const draws = stats.find((s) => s.winnerId === null)?._count || 0;
  const losses = totalGames - wins - draws;

  return Response.json({
    matches: items.map((m) => {
      const isSente = m.senteId === user!.id;
      const opponent = isSente ? m.gote : m.sente;
      const result = m.winnerId === user!.id ? 'win' : m.winnerId === null ? 'draw' : 'lose';

      return {
        id: m.id,
        opponent: opponent
          ? { type: 'human' as const, handleName: opponent.handleName }
          : { type: 'cpu' as const, level: m.cpuLevel },
        mySide: isSente ? 'sente' : 'gote',
        result,
        resultType: m.resultType,
        totalMoves: m.totalMoves,
        timeControl: m.timeControl,
        startedAt: m.startedAt,
        endedAt: m.endedAt,
      };
    }),
    summary: { totalGames, wins, losses, draws },
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
}
