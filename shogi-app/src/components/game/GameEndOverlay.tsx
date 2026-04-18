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

  let title: string;
  let subtitle: string;
  let isWin = false;

  if (status.type === 'checkmate' || status.type === 'resign' || status.type === 'timeout' || status.type === 'disconnect') {
    isWin = status.winner === myPlayer;
    title = isWin ? '勝 利' : '敗 北';
    const typeLabel = { checkmate: '詰み', resign: '投了', timeout: '時間切れ', disconnect: '接続断' }[status.type];
    subtitle = `${typeLabel}　${moveCount}手`;
  } else if (status.type === 'draw') {
    title = '引 分';
    subtitle = status.reason === 'sennichite' ? '千日手' : '持将棋';
  } else {
    title = '反則負け';
    subtitle = `${status.reason}`;
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="card-urushi rounded-lg p-8 mx-4 max-w-sm w-full text-center relative overflow-hidden">
        {/* 金箔装飾 */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4A017] to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4A017] to-transparent" />

        <div className="divider-kinpaku w-16 mx-auto mb-4" />

        <h2 className={`font-[family-name:var(--font-noto-serif)] text-3xl font-bold mb-2 tracking-[0.3em] ${
          isWin ? 'text-kinpaku' : 'text-[#F0E6D3]/50'
        }`}>
          {title}
        </h2>
        <p className="text-[#F0E6D3]/60 text-sm mb-2">{subtitle}</p>

        {!isWin && (status.type === 'resign' || status.type === 'checkmate') && (
          <p className="text-xs text-[#F4A7B9]/50 mb-4 font-serif">「ありがとうございました」</p>
        )}

        <div className="divider-kinpaku w-16 mx-auto mb-6 mt-4" />

        <div className="space-y-2">
          <Link
            href={`/records/${matchId}`}
            className="btn-sumire block w-full py-2.5 rounded-lg font-serif tracking-wider"
          >
            棋譜を見る
          </Link>
          <Link
            href="/dashboard"
            className="block w-full py-2.5 rounded-lg border border-[#D4A017]/20 text-[#D4A017]/60 hover:text-[#D4A017] hover:border-[#D4A017]/40 transition-colors font-serif tracking-wider"
          >
            御座所へ
          </Link>
        </div>
      </div>
    </div>
  );
}
