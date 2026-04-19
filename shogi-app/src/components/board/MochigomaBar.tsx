'use client';

import type { KomaType, Mochigoma, Player } from '@/lib/shogi/core/types';
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
    <div className="card-yukaku flex items-center gap-1 px-3 py-2 min-h-[54px] rounded-sm">
      {pieces.length === 0 ? (
        <span className="text-xs text-[#F4E4C1]/50 px-1 font-serif tracking-widest">
          持ち駒なし
        </span>
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
                relative w-10 h-11 flex-shrink-0
                ${isMyTurn ? 'cursor-pointer hover:-translate-y-0.5 transition-transform' : 'cursor-default'}
                ${isSelected ? 'ring-2 ring-[#F0CF6A] rounded' : ''}
              `}
              style={
                isSelected
                  ? { filter: 'drop-shadow(0 0 8px rgba(240,207,106,.8))' }
                  : undefined
              }
            >
              <PieceComponent
                type={piece}
                owner={owner}
                perspective={perspective}
                isSelected={isSelected}
              />
              {count > 1 && (
                <span
                  className="absolute -bottom-1 -right-1 bg-[#C4364A] text-[#FFF8F0] text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
                  style={{ boxShadow: '0 0 0 1.5px #D4A017' }}
                >
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
