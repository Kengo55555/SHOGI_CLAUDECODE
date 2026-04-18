'use client';

import type { KomaType, Mochigoma, Player } from '@/lib/shogi/core/types';
import { isPromoted } from '@/lib/shogi/core/constants';
import { PieceComponent } from './Piece';

interface MochigomaBarProps {
  mochigoma: Mochigoma;
  owner: Player;
  isMyTurn: boolean;
  selectedPiece: KomaType | null;
  perspective: Player;
  onSelect: (piece: KomaType) => void;
}

const MOCHIGOMA_ORDER: KomaType[] = ['hisha', 'kaku', 'kin', 'gin', 'kei', 'kyou', 'fu'];

export function MochigomaBar({ mochigoma, owner, isMyTurn, selectedPiece, perspective, onSelect }: MochigomaBarProps) {
  const pieces = MOCHIGOMA_ORDER.filter((k) => (mochigoma[k] || 0) > 0);

  return (
    <div className="flex items-center gap-0.5 px-2 py-1 min-h-[44px] bg-[#C4943C]/15 rounded border border-[#C4943C]/20">
      {pieces.length === 0 ? (
        <span className="text-xs text-gray-400 px-1">持ち駒なし</span>
      ) : (
        pieces.map((piece) => {
          const count = mochigoma[piece] || 0;
          const isSelected = selectedPiece === piece;
          return (
            <button
              key={piece}
              onClick={() => isMyTurn && onSelect(piece)}
              disabled={!isMyTurn}
              className={`
                relative w-9 h-10 flex-shrink-0
                ${isMyTurn ? 'cursor-pointer' : 'cursor-default'}
                ${isSelected ? 'ring-2 ring-[#2B4C7E] rounded' : ''}
              `}
            >
              <PieceComponent type={piece} owner={owner} perspective={perspective} isSelected={isSelected} />
              {count > 1 && (
                <span className="absolute -bottom-0.5 -right-0.5 bg-[#2B4C7E] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          );
        })
      )}
    </div>
  );
}
