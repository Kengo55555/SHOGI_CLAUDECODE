'use client';

import type { Piece, Position, Player } from '@/lib/shogi/core/types';
import { PieceComponent } from './Piece';

interface SquareProps {
  position: Position;
  piece: Piece | null;
  isLastMove: boolean;
  isLegalTarget: boolean;
  isSelected: boolean;
  isStar: boolean;
  perspective: Player;
  onClick: (pos: Position) => void;
}

export function Square({ position, piece, isLastMove, isLegalTarget, isSelected, isStar, perspective, onClick }: SquareProps) {
  return (
    <div
      onClick={() => onClick(position)}
      className={`
        relative aspect-square
        border-r border-b border-[#3D2B1F]/50
        flex items-center justify-center
        cursor-pointer
        ${isLastMove ? 'bg-[#C8B83C]/25' : ''}
        ${isSelected ? 'bg-[#5B8EC9]/25' : ''}
      `}
    >
      {/* 星（目印） */}
      {isStar && !piece && (
        <div className="absolute w-[8px] h-[8px] bg-[#3D2B1F] rounded-full" />
      )}

      {piece && (
        <PieceComponent
          type={piece.type}
          owner={piece.owner}
          perspective={perspective}
          isSelected={isSelected}
        />
      )}

      {/* 合法手マーカー */}
      {isLegalTarget && !piece && (
        <div className="absolute w-[28%] h-[28%] bg-[#2B4C7E]/30 rounded-full" />
      )}
      {isLegalTarget && piece && (
        <div className="absolute inset-[6%] border-[2.5px] border-[#C41E3A]/40 rounded-full" />
      )}
    </div>
  );
}
