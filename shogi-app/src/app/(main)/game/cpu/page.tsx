'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const LEVELS = [
  { value: 1, label: '初伝', stars: 1, desc: '手ほどき' },
  { value: 2, label: '中伝', stars: 2, desc: '級位者向け' },
  { value: 3, label: '奥伝', stars: 3, desc: '有段者向け' },
] as const;

export default function CpuSelectPage() {
  const router = useRouter();
  const [cpuLevel, setCpuLevel] = useState<1 | 2 | 3>(1);
  const [playerSente, setPlayerSente] = useState<boolean | null>(null);
  const [timeControl, setTimeControl] = useState<10 | 15 | 0>(15);
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    try {
      const res = await fetch('/api/matches/cpu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpuLevel, timeControl: timeControl || 15, playerSente: playerSente ?? undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/game/${data.matchId}?side=${data.playerSide}`);
      }
    } catch {} finally { setLoading(false); }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h2 className="font-[family-name:var(--font-noto-serif)] text-xl font-bold text-kinpaku mb-6 tracking-wider text-center">一人稽古</h2>

      <section className="mb-6">
        <h3 className="text-xs font-medium mb-3 text-[#D4A017]/70">相手の力量</h3>
        <div className="grid grid-cols-3 gap-3">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              onClick={() => setCpuLevel(l.value)}
              className={`card-urushi rounded-lg p-4 text-center transition-all ${
                cpuLevel === l.value ? 'border-[#D4A017]/70 shadow-[0_0_15px_rgba(212,160,23,0.15)]' : ''
              }`}
            >
              <div className="font-bold font-serif text-[#F0E6D3] mb-1">{l.label}</div>
              <div className="text-[#D4A017] text-sm mb-1">{'★'.repeat(l.stars)}{'☆'.repeat(3 - l.stars)}</div>
              <div className="text-[10px] text-[#F0E6D3]/40">{l.desc}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-xs font-medium mb-3 text-[#D4A017]/70">先後の選択</h3>
        <div className="space-y-2">
          {[
            { value: true, label: '先手（自分が先に指す）' },
            { value: false, label: '後手（CPUが先に指す）' },
            { value: null, label: 'お任せ' },
          ].map((opt) => (
            <label key={String(opt.value)} className="flex items-center gap-2 cursor-pointer text-sm text-[#F0E6D3]/70">
              <input type="radio" name="side" checked={playerSente === opt.value} onChange={() => setPlayerSente(opt.value as boolean | null)} className="accent-[#D4A017]" />
              {opt.label}
            </label>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-xs font-medium mb-3 text-[#D4A017]/70">持ち時間</h3>
        <div className="space-y-2">
          {[{ value: 10, label: '十分' }, { value: 15, label: '十五分' }, { value: 0, label: 'なし' }].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm text-[#F0E6D3]/70">
              <input type="radio" name="time" checked={timeControl === opt.value} onChange={() => setTimeControl(opt.value as 10 | 15 | 0)} className="accent-[#D4A017]" />
              {opt.label}
            </label>
          ))}
        </div>
      </section>

      <button onClick={handleStart} disabled={loading} className="btn-kurenai w-full py-3 rounded-lg text-lg font-bold tracking-[0.3em] disabled:opacity-50">
        {loading ? '準備中...' : '対 局 開 始'}
      </button>
    </div>
  );
}
