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
    title = isWin ? 'あなたの勝ちです' : '負けました';
    const typeLabel = {
      checkmate: '詰み',
      resign: '投了',
      timeout: '時間切れ',
      disconnect: '接続断',
    }[status.type];
    subtitle = `${typeLabel}  ${moveCount}手`;
  } else if (status.type === 'draw') {
    title = '引き分け';
    subtitle = status.reason === 'sennichite' ? '千日手' : '持将棋';
  } else {
    title = '反則負け';
    subtitle = `${status.reason}`;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 mx-4 max-w-sm w-full text-center">
        <h2 className={`text-2xl font-bold mb-2 font-[family-name:var(--font-noto-serif)] ${isWin ? 'text-[#B8860B]' : 'text-gray-700'}`}>
          {title}
        </h2>
        <p className="text-gray-600 mb-2">{subtitle}</p>

        {!isWin && (status.type === 'resign' || status.type === 'checkmate') && (
          <p className="text-sm text-gray-500 mb-4">「ありがとうございました」</p>
        )}

        <div className="space-y-2 mt-6">
          <Link
            href={`/records/${matchId}`}
            className="block w-full bg-[#2B4C7E] text-white py-2 rounded-lg hover:bg-[#1E3A5F] transition-colors"
          >
            棋譜を見る
          </Link>
          <Link
            href="/dashboard"
            className="block w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ダッシュボードへ
          </Link>
        </div>
      </div>
    </div>
  );
}
