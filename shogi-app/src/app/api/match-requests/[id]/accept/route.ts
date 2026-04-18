import { prisma } from '@/lib/db';
import { requireAuth, createErrorResponse } from '@/lib/auth';

/** 対戦募集応諾 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { id } = await params;

  // トランザクションで排他制御
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 募集を取得（行ロック相当）
      const matchRequest = await tx.matchRequest.findUnique({
        where: { id },
      });

      if (!matchRequest) {
        throw new Error('MATCH_NOT_FOUND');
      }

      if (matchRequest.status !== 'open') {
        throw new Error('MATCH_REQUEST_ALREADY_ACCEPTED');
      }

      if (matchRequest.expiresAt < new Date()) {
        // 期限切れを更新
        await tx.matchRequest.update({
          where: { id },
          data: { status: 'expired' },
        });
        throw new Error('MATCH_REQUEST_EXPIRED');
      }

      if (matchRequest.requesterId === user!.id) {
        throw new Error('SELF_ACCEPT');
      }

      // 募集を応諾済みに更新
      await tx.matchRequest.update({
        where: { id, status: 'open' },
        data: {
          status: 'accepted',
          responderId: user!.id,
        },
      });

      // 先手/後手をランダムに決定
      const isSente = Math.random() < 0.5;
      const senteId = isSente ? matchRequest.requesterId : user!.id;
      const goteId = isSente ? user!.id : matchRequest.requesterId;

      // 対局レコード作成
      const match = await tx.match.create({
        data: {
          matchRequestId: id,
          senteId,
          goteId,
          timeControl: matchRequest.timeControl,
        },
      });

      return {
        matchId: match.id,
        senteId,
        goteId,
        timeControl: matchRequest.timeControl,
      };
    });

    // TODO: WebSocketで両者に対局開始を通知（DD-04で実装）

    return Response.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'INTERNAL_ERROR';

    const errorMap: Record<string, { msg: string; status: number }> = {
      MATCH_NOT_FOUND: { msg: '対戦募集が見つかりません', status: 404 },
      MATCH_REQUEST_ALREADY_ACCEPTED: { msg: 'この募集は既に他のユーザーに応諾されています', status: 409 },
      MATCH_REQUEST_EXPIRED: { msg: '対戦募集の有効期限が切れています', status: 410 },
      SELF_ACCEPT: { msg: '自分の募集に応諾することはできません', status: 400 },
    };

    const mapped = errorMap[message];
    if (mapped) {
      return createErrorResponse(message as Parameters<typeof createErrorResponse>[0], mapped.msg, mapped.status);
    }

    return createErrorResponse('INTERNAL_ERROR', 'エラーが発生しました', 500);
  }
}
