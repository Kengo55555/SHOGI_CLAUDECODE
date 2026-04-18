'use client';

import { useState } from 'react';

interface GameControlsProps {
  isCpuGame: boolean;
  remainingUndos?: number;
  onResign: () => void;
  onUndo?: () => void;
  onAbort?: () => void;
}

export function GameControls({ isCpuGame, remainingUndos, onResign, onUndo, onAbort }: GameControlsProps) {
  const [showResignConfirm, setShowResignConfirm] = useState(false);

  return (
    <div className="flex gap-2 justify-center">
      {isCpuGame && onUndo && (
        <button
          onClick={onUndo}
          disabled={!remainingUndos}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          待った{remainingUndos !== undefined ? `（残り${remainingUndos}回）` : ''}
        </button>
      )}

      {!showResignConfirm ? (
        <button
          onClick={() => setShowResignConfirm(true)}
          className="px-4 py-2 border border-[#C41E3A] text-[#C41E3A] rounded-lg text-sm hover:bg-red-50 transition-colors"
        >
          投了
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => { onResign(); setShowResignConfirm(false); }}
            className="px-4 py-2 bg-[#C41E3A] text-white rounded-lg text-sm"
          >
            投了する
          </button>
          <button
            onClick={() => setShowResignConfirm(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            戻る
          </button>
        </div>
      )}

      {isCpuGame && onAbort && (
        <button
          onClick={onAbort}
          className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          中断
        </button>
      )}
    </div>
  );
}
