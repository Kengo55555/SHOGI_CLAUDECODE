'use client';

import type { PieceType, KomaType } from '@/lib/shogi/core/types';
import { PIECE_KANJI, PROMOTION_MAP } from '@/lib/shogi/core/constants';

interface PromotionDialogProps {
  pieceType: KomaType;
  onChoice: (promote: boolean) => void;
}

export function PromotionDialog({ pieceType, onChoice }: PromotionDialogProps) {
  const promoted = PROMOTION_MAP[pieceType];
  if (!promoted) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 mx-4">
        <p className="text-center font-medium mb-4">成りますか？</p>
        <div className="flex gap-4">
          <button
            onClick={() => onChoice(true)}
            className="flex-1 bg-[#2D5F2D] text-white py-3 px-6 rounded-lg font-bold text-lg hover:bg-[#245024] transition-colors"
          >
            <span className="text-[#C41E3A]">{PIECE_KANJI[promoted]}</span>
            <br />
            <span className="text-xs font-normal">成る</span>
          </button>
          <button
            onClick={() => onChoice(false)}
            className="flex-1 border-2 border-gray-300 py-3 px-6 rounded-lg font-bold text-lg hover:bg-gray-50 transition-colors"
          >
            {PIECE_KANJI[pieceType]}
            <br />
            <span className="text-xs font-normal">不成</span>
          </button>
        </div>
      </div>
    </div>
  );
}
