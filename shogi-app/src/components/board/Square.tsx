'use client';

import type { Piece, Position } from '@/lib/shogi/core/types';
import { PieceComponent } from './Piece';

interface SquareProps {
  position: Position;
  piece: Piece | null;
  isLastMove: boolean;
  isLegalTarget: boolean;
  isSelected: boolean;
  onClick: (pos: Position) => void;
}

export function Square({ position, piece, isLastMove, isLegalTarget, isSelected, onClick }: SquareProps) {
  return (
    <div
      onClick={() => onClick(position)}
      className={`
        relative aspect-square border-r border-b border-[#4A3520]/40
        flex items-center justify-center
        cursor-pointer
        ${isLastMove ? 'bg-yellow-200/40' : ''}
        ${isSelected ? 'bg-blue-200/40' : ''}
      `}
    >
      {piece && (
        <PieceComponent
          type={piece.type}
          owner={piece.owner}
          isSelected={isSelected}
        />
      )}

      {/* 合法手マーカー */}
      {isLegalTarget && !piece && (
        <div className="absolute w-[30%] h-[30%] bg-black/20 rounded-full" />
      )}
      {isLegalTarget && piece && (
        <div className="absolute inset-1 border-2 border-black/25 rounded-full" />
      )}
    </div>
  );
}
