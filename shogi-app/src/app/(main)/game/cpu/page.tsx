'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const LEVELS = [
  { value: 1, label: '初級', stars: 1, desc: 'ルール練習に' },
  { value: 2, label: '中級', stars: 2, desc: '級位者向け' },
  { value: 3, label: '上級', stars: 3, desc: '有段者向け' },
] as const;

export default function CpuSelectPage() {
  const router = useRouter();
  const [cpuLevel, setCpuLevel] = useState<1 | 2 | 3>(1);
  const [playerSente, setPlayerSente] = useState<boolean | null>(null); // null = ランダム
  const [timeControl, setTimeControl] = useState<10 | 15 | 0>(15); // 0 = なし
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    try {
      const res = await fetch('/api/matches/cpu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpuLevel,
          timeControl: timeControl || 15,
          playerSente: playerSente ?? undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/game/${data.matchId}?side=${data.playerSide}`);
      }
    } catch {
      // エラー処理
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h2 className="text-xl font-bold mb-6">CPU対戦</h2>

      {/* レベル選択 */}
      <section className="mb-6">
        <h3 className="text-sm font-medium mb-3">レベルを選んでください</h3>
        <div className="grid grid-cols-3 gap-3">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              onClick={() => setCpuLevel(l.value)}
              className={`rounded-lg border-2 p-4 text-center transition-colors ${
                cpuLevel === l.value
                  ? 'border-[#2B4C7E] bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-bold mb-1">{l.label}</div>
              <div className="text-yellow-500 text-sm mb-1">
                {'★'.repeat(l.stars)}{'☆'.repeat(3 - l.stars)}
              </div>
              <div className="text-xs text-gray-500">{l.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* 先手/後手選択 */}
      <section className="mb-6">
        <h3 className="text-sm font-medium mb-3">先手/後手の選択</h3>
        <div className="space-y-2">
          {[
            { value: true, label: '先手（自分が先に指す）' },
            { value: false, label: '後手（CPUが先に指す）' },
            { value: null, label: 'ランダム' },
          ].map((opt) => (
            <label key={String(opt.value)} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="playerSente"
                checked={playerSente === opt.value}
                onChange={() => setPlayerSente(opt.value as boolean | null)}
                className="accent-[#2B4C7E]"
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* 持ち時間 */}
      <section className="mb-8">
        <h3 className="text-sm font-medium mb-3">持ち時間</h3>
        <div className="space-y-2">
          {[
            { value: 10, label: '10分' },
            { value: 15, label: '15分' },
            { value: 0, label: 'なし' },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="timeControl"
                checked={timeControl === opt.value}
                onChange={() => setTimeControl(opt.value as 10 | 15 | 0)}
                className="accent-[#2B4C7E]"
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </section>

      <button
        onClick={handleStart}
        disabled={loading}
        className="w-full bg-[#2D5F2D] text-white py-3 rounded-lg text-lg font-medium hover:bg-[#245024] transition-colors disabled:opacity-50"
      >
        {loading ? '準備中...' : '対局開始'}
      </button>
    </div>
  );
}
