import { prisma } from '@/lib/db';

interface NotificationPayload {
  type: 'match_request' | 'match_accepted' | 'match_result' | 'request_expired';
  recipientIds: string[];
  title: string;
  body: string;
  referenceId: string;
}

/**
 * 通知を送信する（サイト内通知 + メール）
 */
export async function sendNotification(payload: NotificationPayload): Promise<void> {
  const { type, recipientIds, title, body, referenceId } = payload;

  // サイト内通知を一括作成
  if (recipientIds.length > 0) {
    await prisma.notification.createMany({
      data: recipientIds.map((userId) => ({
        userId,
        type,
        title,
        body,
        referenceId,
      })),
    });
  }

  // メール通知（非同期・opt-in のみ）
  // MVP: setTimeoutで簡易的な非同期送信
  setTimeout(async () => {
    try {
      const settings = await prisma.notificationSettings.findMany({
        where: {
          userId: { in: recipientIds },
          emailEnabled: true,
        },
        include: { user: true },
      });

      for (const setting of settings) {
        // TODO: SendGrid APIでメール送信
        console.log(`[Email] Would send to ${setting.user.email}: ${title}`);
      }
    } catch (err) {
      console.error('[Notification] Email send error:', err);
    }
  }, 100);
}

/**
 * 対戦募集通知（発信者以外の全ユーザーに送信）
 */
export async function notifyMatchRequest(
  requesterId: string,
  requesterName: string,
  timeControl: number,
  matchRequestId: string,
): Promise<void> {
  const users = await prisma.user.findMany({
    where: { id: { not: requesterId }, deletedAt: null },
    select: { id: true },
  });

  await sendNotification({
    type: 'match_request',
    recipientIds: users.map((u) => u.id),
    title: '対戦募集',
    body: `${requesterName}さんが対戦相手を募集しています（${timeControl}分切れ負け）`,
    referenceId: matchRequestId,
  });
}

/**
 * 応諾通知（募集者に送信）
 */
export async function notifyMatchAccepted(
  requesterId: string,
  responderName: string,
  matchId: string,
): Promise<void> {
  await sendNotification({
    type: 'match_accepted',
    recipientIds: [requesterId],
    title: '対戦相手が見つかりました',
    body: `${responderName}さんがあなたの対戦募集に応じました`,
    referenceId: matchId,
  });
}

/**
 * 対局結果通知（両者に送信）
 */
export async function notifyMatchResult(
  playerIds: string[],
  result: string,
  totalMoves: number,
  matchId: string,
): Promise<void> {
  await sendNotification({
    type: 'match_result',
    recipientIds: playerIds,
    title: '対局結果',
    body: `対局が終了しました（${result}・${totalMoves}手）`,
    referenceId: matchId,
  });
}
