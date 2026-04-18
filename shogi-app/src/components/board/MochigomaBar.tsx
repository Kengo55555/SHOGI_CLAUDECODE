'use client';

import type { KomaType, Mochigoma, Player } from '@/lib/shogi/core/types';
import { PIECE_KANJI } from '@/lib/shogi/core/constants';

interface MochigomaBarProps {
  mochigoma: Mochigoma;
  owner: Player;
  isMyTurn: boolean;
  selectedPiece: KomaType | null;
  onSelect: (piece: KomaType) => void;
}

const MOCHIGOMA_ORDER: KomaType[] = ['hisha', 'kaku', 'kin', 'gin', 'kei', 'kyou', 'fu'];

export function MochigomaBar({ mochigoma, owner, isMyTurn, selectedPiece, onSelect }: MochigomaBarProps) {
  const pieces = MOCHIGOMA_ORDER.filter((k) => (mochigoma[k] || 0) > 0);

  return (
    <div className="flex items-center gap-1 px-2 py-1 min-h-[36px] bg-[#D4A856]/20 rounded">
      {pieces.length === 0 ? (
        <span className="text-xs text-gray-400">なし</span>
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
                flex items-center gap-0.5 px-1.5 py-0.5 rounded text-sm
                ${isMyTurn ? 'cursor-pointer hover:bg-[#DDB06C]/40' : 'cursor-default'}
                ${isSelected ? 'bg-blue-200/60 ring-1 ring-[#2B4C7E]' : ''}
              `}
            >
              <span className="font-bold font-serif">{PIECE_KANJI[piece]}</span>
              {count > 1 && <span className="text-xs text-gray-600">x{count}</span>}
            </button>
          );
        })
      )}
    </div>
  );
}
