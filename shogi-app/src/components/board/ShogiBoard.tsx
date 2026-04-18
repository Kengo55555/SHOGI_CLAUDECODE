'use client';

import type { BoardState, Position, Player } from '@/lib/shogi/core/types';
import { getPieceAt } from '@/lib/shogi/core/board';
import { Square } from './Square';
import { SUJI_KANJI, DAN_KANJI } from '@/lib/shogi/core/constants';

interface ShogiBoardProps {
  boardState: BoardState;
  perspective: Player; // 盤面の向き（手前側のプレイヤー）
  lastMove: { from?: Position; to: Position } | null;
  legalTargets: Position[];
  selectedPosition: Position | null;
  onSquareClick: (pos: Position) => void;
}

export function ShogiBoard({
  boardState,
  perspective,
  lastMove,
  legalTargets,
  selectedPosition,
  onSquareClick,
}: ShogiBoardProps) {
  const isFlipped = perspective === 'gote';

  // 段と筋の配列（向きに応じて反転）
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

  return (
    <div className="inline-block">
      {/* 筋番号（上部） */}
      <div className="flex ml-6">
        {sujiRange.map((suji) => (
          <div key={suji} className="w-[calc(100%/9)] text-center text-xs text-gray-500">
            {SUJI_KANJI[suji]}
          </div>
        ))}
      </div>

      <div className="flex">
        {/* 盤面 */}
        <div
          className="grid grid-cols-9 border-l border-t border-[#4A3520]/60 bg-[#DDB06C]"
          style={{ width: 'min(calc(100vw - 80px), 450px)', aspectRatio: '1/1' }}
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
                  onClick={onSquareClick}
                />
              );
            })
          )}
        </div>

        {/* 段番号（右側） */}
        <div className="flex flex-col ml-1">
          {danRange.map((dan) => (
            <div key={dan} className="flex-1 flex items-center text-xs text-gray-500">
              {DAN_KANJI[dan]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
