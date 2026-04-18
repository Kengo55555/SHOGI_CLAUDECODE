'use client';

import type { BoardState, Position, Player } from '@/lib/shogi/core/types';
import { getPieceAt } from '@/lib/shogi/core/board';
import { Square } from './Square';

interface ShogiBoardProps {
  boardState: BoardState;
  perspective: Player;
  lastMove: { from?: Position; to: Position } | null;
  legalTargets: Position[];
  selectedPosition: Position | null;
  onSquareClick: (pos: Position) => void;
}

/** 星の位置（3三、3七、7三、7七） */
const STAR_POSITIONS = [
  { suji: 3, dan: 3 }, { suji: 3, dan: 7 },
  { suji: 7, dan: 3 }, { suji: 7, dan: 7 },
];

const SUJI_LABELS = ['', '９', '８', '７', '６', '５', '４', '３', '２', '１'];
const DAN_LABELS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

export function ShogiBoard({
  boardState, perspective, lastMove, legalTargets, selectedPosition, onSquareClick,
}: ShogiBoardProps) {
  const isFlipped = perspective === 'gote';
  const danRange = isFlipped ? [9, 8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const sujiRange = isFlipped ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [9, 8, 7, 6, 5, 4, 3, 2, 1];

  function isLastMoveSquare(suji: number, dan: number): boolean {
    if (!lastMove) return false;
    if (lastMove.to.suji === suji && lastMove.to.dan === dan) return true;
    if (lastMove.from && lastMove.from.suji === suji && lastMove.from.dan === dan) return true;
    return false;
  }

  function isLegalTarget(suji: number, dan: number): boolean {
    return legalTargets.some((p) => p.suji === suji && p.dan === dan);
  }

  function isSelected(suji: number, dan: number): boolean {
    return selectedPosition?.suji === suji && selectedPosition?.dan === dan;
  }

  function isStar(suji: number, dan: number): boolean {
    return STAR_POSITIONS.some((p) => p.suji === suji && p.dan === dan);
  }

  return (
    <div className="inline-block">
      {/* 筋番号（上部） */}
      <div className="flex ml-6 mr-5">
        {sujiRange.map((suji) => (
          <div key={suji} className="flex-1 text-center text-[11px] text-[#5C3D1A] font-serif pb-0.5">
            {SUJI_LABELS[isFlipped ? 10 - suji : suji]}
          </div>
        ))}
      </div>

      <div className="flex">
        {/* 盤面 */}
        <div
          className="grid grid-cols-9 border-l-2 border-t-2 border-[#3D2B1F]/70 bg-[#D4A84B] shadow-lg"
          style={{
            width: 'min(calc(100vw - 80px), 450px)',
            aspectRatio: '1/1',
            backgroundImage: `
              linear-gradient(135deg, #D9B35A 0%, #C99B3A 30%, #D4A84B 50%, #CDAA45 70%, #C49535 100%)
            `,
          }}
        >
          {danRange.map((dan) =>
            sujiRange.map((suji) => {
              const piece = getPieceAt(boardState, { suji, dan });
              return (
                <Square
                  key={`${suji}-${dan}`}
                  position={{ suji, dan }}
                  piece={piece}
                  isLastMove={isLastMoveSquare(suji, dan)}
                  isLegalTarget={isLegalTarget(suji, dan)}
                  isSelected={isSelected(suji, dan)}
                  isStar={isStar(suji, dan)}
                  onClick={onSquareClick}
                />
              );
            })
          )}
        </div>

        {/* 段番号（右側） */}
        <div className="flex flex-col ml-1">
          {danRange.map((dan) => (
            <div key={dan} className="flex-1 flex items-center text-[11px] text-[#5C3D1A] font-serif pl-0.5">
              {DAN_LABELS[isFlipped ? 10 - dan : dan]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
