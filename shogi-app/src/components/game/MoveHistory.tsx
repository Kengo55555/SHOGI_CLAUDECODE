'use client';

import type { Action, GameState } from '@/lib/shogi/core/types';
import { PIECE_KANJI, SUJI_KANJI, DAN_KANJI } from '@/lib/shogi/core/constants';

interface MoveHistoryProps {
  moves: Action[];
  currentMoveIndex: number;
  onSelectMove: (index: number) => void;
}

function formatMove(action: Action, index: number): string {
  const num = String(index + 1).padStart(3, ' ');
  const to = action.type === 'move' ? action.to : action.to;
  const posStr = `${SUJI_KANJI[to.suji]}${DAN_KANJI[to.dan]}`;

  if (action.type === 'drop') {
    return `${num} ${posStr}${PIECE_KANJI[action.piece]}打`;
  }

  const suffix = action.promote ? '成' : '';
  return `${num} ${posStr}${suffix}(${action.from.suji}${action.from.dan})`;
}

export function MoveHistory({ moves, currentMoveIndex, onSelectMove }: MoveHistoryProps) {
  return (
    <div className="border rounded-lg bg-white p-2 max-h-[300px] overflow-y-auto">
      <div className="text-xs font-medium text-gray-500 mb-1">指し手</div>
      {moves.length === 0 ? (
        <div className="text-xs text-gray-400">まだ指し手がありません</div>
      ) : (
        moves.map((move, i) => (
          <button
            key={i}
            onClick={() => onSelectMove(i)}
            className={`block w-full text-left text-xs py-0.5 px-1 rounded font-mono ${
              i === currentMoveIndex ? 'bg-[#2B4C7E] text-white' : 'hover:bg-gray-100'
            }`}
          >
            {formatMove(move, i)}
          </button>
        ))
      )}
    </div>
  );
}
