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
        border-r border-b border-[#1A0607]/80
        flex items-center justify-center
        cursor-pointer
        ${isLastMove ? 'bg-[#F0CF6A]/25' : ''}
        ${isSelected ? 'bg-[#C4364A]/20' : ''}
      `}
      style={
        isLastMove ? { boxShadow: 'inset 0 0 0 1.5px rgba(240,207,106,.6)' } : undefined
      }
    >
      {isStar && !piece && (
        <div className="absolute w-[9px] h-[9px] bg-[#1A0607] rounded-full" />
      )}

      {piece && (
        <PieceComponent
          type={piece.type}
          owner={piece.owner}
          perspective={perspective}
          isSelected={isSelected}
        />
      )}

      {/* 合法手：金ドット＋紅外輪 */}
      {isLegalTarget && !piece && (
        <div
          className="absolute w-[30%] h-[30%] rounded-full"
          style={{
            background:
              'radial-gradient(circle, #D4A017 0%, #D4A017 55%, #C4364A 58%, transparent 62%)',
            boxShadow: '0 0 8px rgba(240,207,106,.6)',
          }}
        />
      )}
      {isLegalTarget && piece && (
        <div className="absolute inset-[6%] border-[2.5px] border-[#C4364A]/70 rounded-full" />
      )}
    </div>
  );
}
