'use client';

import type { PieceType, Player } from '@/lib/shogi/core/types';
import { PIECE_KANJI } from '@/lib/shogi/core/constants';
import { isPromoted } from '@/lib/shogi/core/constants';

interface PieceProps {
  type: PieceType;
  owner: Player;
  isSelected?: boolean;
  onMouseDown?: () => void;
}

export function PieceComponent({ type, owner, isSelected, onMouseDown }: PieceProps) {
  const kanji = PIECE_KANJI[type];
  const isNari = isPromoted(type);
  const isGote = owner === 'gote';

  return (
    <div
      onMouseDown={onMouseDown}
      className={`
        relative w-full h-full flex items-center justify-center cursor-pointer select-none
        ${isSelected ? 'scale-110 z-10' : 'hover:scale-105'}
        transition-transform duration-100
      `}
    >
      {/* 駒の五角形 */}
      <svg viewBox="0 0 40 44" className="w-[85%] h-[85%] drop-shadow-sm">
        <polygon
          points="20,2 38,14 34,42 6,42 2,14"
          fill="#E8C88A"
          stroke="#8B7355"
          strokeWidth="1"
          transform={isGote ? 'rotate(180 20 22)' : ''}
        />
        <text
          x="20"
          y={kanji.length > 1 ? '22' : '26'}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={isNari ? '#C41E3A' : '#1A1A1A'}
          fontSize={kanji.length > 1 ? '10' : '14'}
          fontWeight="bold"
          fontFamily="serif"
          transform={isGote ? 'rotate(180 20 22)' : ''}
        >
          {kanji}
        </text>
      </svg>
    </div>
  );
}
