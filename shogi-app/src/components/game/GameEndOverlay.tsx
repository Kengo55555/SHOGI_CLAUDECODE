'use client';

import Link from 'next/link';
import type { GameStatus, Player } from '@/lib/shogi/core/types';

interface GameEndOverlayProps {
  status: GameStatus;
  myPlayer: Player;
  moveCount: number;
  matchId: string;
}

export function GameEndOverlay({ status, myPlayer, moveCount, matchId }: GameEndOverlayProps) {
  if (status.type === 'playing') return null;

  let title: string, subtitle: string, isWin = false;

  if (status.type === 'checkmate' || status.type === 'resign' || status.type === 'timeout' || status.type === 'disconnect') {
    isWin = status.winner === myPlayer;
    title = isWin ? '勝 利' : '敗 北';
    subtitle = `${{ checkmate: '詰み', resign: '投了', timeout: '時間切れ', disconnect: '接続断' }[status.type]}　${moveCount}手`;
  } else if (status.type === 'draw') {
    title = '引 分';
    subtitle = status.reason === 'sennichite' ? '千日手' : '持将棋';
  } else {
    title = '反則負け';
    subtitle = status.reason;
  }

  return (
    <div className="fixed inset-0 bg-[#2D2226]/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className={`rounded-xl p-8 mx-4 max-w-sm w-full text-center relative overflow-hidden ${
        isWin ? 'bg-gradient-to-b from-[#FFF8F0] via-[#FFF5EC] to-[#FFF0E5] border-2 border-[#D4A017]/40' : 'card-hana'
      }`}>
        <div className="absolute top-0 left-0 w-full h-1 bg-kurenai-obi" />
        <div className="divider-hana w-16 mx-auto mb-4 mt-2" />

        <h2 className={`font-[family-name:var(--font-noto-serif)] text-3xl font-bold mb-2 tracking-[0.3em] ${
          isWin ? 'text-[#D4A017]' : 'text-[#2D2226]/50'
        }`}>
          {title}
        </h2>
        <p className="text-[#2D2226]/50 text-sm">{subtitle}</p>

        {!isWin && (status.type === 'resign' || status.type === 'checkmate') && (
          <p className="text-xs text-[#C4364A]/40 mt-2 font-serif">「ありがとうございました」</p>
        )}

        <div className="divider-hana w-16 mx-auto mb-6 mt-4" />

        <div className="space-y-2">
          <Link href={`/records/${matchId}`} className="btn-sumire block w-full py-2.5 rounded-lg font-serif tracking-wider">棋譜を見る</Link>
          <Link href="/dashboard" className="block w-full py-2.5 rounded-lg border border-[#C4364A]/20 text-[#C4364A]/60 hover:text-[#C4364A] transition-colors font-serif tracking-wider">御座所へ</Link>
        </div>
      </div>
    </div>
  );
}
