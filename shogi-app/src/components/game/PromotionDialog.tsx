'use client';

import type { KomaType } from '@/lib/shogi/core/types';
import { PIECE_KANJI, PROMOTION_MAP } from '@/lib/shogi/core/constants';

interface PromotionDialogProps {
  pieceType: KomaType;
  onChoice: (promote: boolean) => void;
}

export function PromotionDialog({ pieceType, onChoice }: PromotionDialogProps) {
  const promoted = PROMOTION_MAP[pieceType];
  if (!promoted) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="card-urushi rounded-lg p-6 mx-4 relative">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#D4A017] to-transparent" />
        <p className="text-center font-serif text-[#D4A017] mb-4">成りますか？</p>
        <div className="flex gap-4">
          <button
            onClick={() => onChoice(true)}
            className="btn-kurenai flex-1 py-4 px-6 rounded-lg font-bold text-xl font-serif"
          >
            <span className="text-[#F5D060]">{PIECE_KANJI[promoted]}</span>
            <br />
            <span className="text-xs font-normal opacity-80">成る</span>
          </button>
          <button
            onClick={() => onChoice(false)}
            className="flex-1 py-4 px-6 rounded-lg border border-[#D4A017]/30 text-[#F0E6D3] font-bold text-xl font-serif hover:border-[#D4A017]/60 transition-colors"
          >
            {PIECE_KANJI[pieceType]}
            <br />
            <span className="text-xs font-normal opacity-50">不成</span>
          </button>
        </div>
      </div>
    </div>
  );
}
