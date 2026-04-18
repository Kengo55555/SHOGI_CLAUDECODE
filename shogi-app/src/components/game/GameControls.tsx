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
          className="px-4 py-2 border border-[#D4A017]/20 text-[#D4A017]/60 rounded-lg text-sm hover:border-[#D4A017]/40 hover:text-[#D4A017] disabled:opacity-20 disabled:cursor-not-allowed transition-colors font-serif"
        >
          待った{remainingUndos !== undefined ? `（残${remainingUndos}）` : ''}
        </button>
      )}

      {!showResignConfirm ? (
        <button
          onClick={() => setShowResignConfirm(true)}
          className="px-4 py-2 border border-[#C41E3A]/30 text-[#C41E3A]/70 rounded-lg text-sm hover:border-[#C41E3A]/60 hover:text-[#C41E3A] transition-colors font-serif"
        >
          投了
        </button>
      ) : (
        <div className="flex gap-2">
          <button onClick={() => { onResign(); setShowResignConfirm(false); }} className="btn-kurenai px-4 py-2 rounded-lg text-sm font-serif">
            投了する
          </button>
          <button onClick={() => setShowResignConfirm(false)} className="px-4 py-2 border border-[#D4A017]/20 text-[#F0E6D3]/50 rounded-lg text-sm font-serif">
            戻る
          </button>
        </div>
      )}

      {isCpuGame && onAbort && (
        <button onClick={onAbort} className="px-4 py-2 border border-[#F0E6D3]/10 text-[#F0E6D3]/30 rounded-lg text-sm hover:text-[#F0E6D3]/50 transition-colors font-serif">
          中断
        </button>
      )}
    </div>
  );
}
