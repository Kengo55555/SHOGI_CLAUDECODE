'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewMatchRequestPage() {
  const router = useRouter();
  const [timeControl, setTimeControl] = useState<10 | 15>(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/match-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeControl }),
      });

      if (res.ok) {
        router.push('/match-requests');
      } else {
        const data = await res.json();
        setError(data.error?.message || 'エラーが発生しました');
      }
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h2 className="font-[family-name:var(--font-noto-serif)] text-xl font-bold mb-6 text-kinpaku tracking-wider text-center">対戦募集</h2>

      <section className="mb-6">
        <h3 className="text-xs font-medium mb-3 text-[#D4A017]/70">持ち時間</h3>
        <div className="space-y-2">
          {[
            { value: 10 as const, label: '十分切れ負け' },
            { value: 15 as const, label: '十五分切れ負け' },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm text-[#F4E4C1]/70">
              <input
                type="radio"
                name="timeControl"
                checked={timeControl === opt.value}
                onChange={() => setTimeControl(opt.value)}
                className="accent-[#D4A017]"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </section>

      <p className="text-xs text-[#F4E4C1]/30 mb-6 font-serif">
        ※全登録ユーザーに通知が送信されます
      </p>

      {error && <p className="text-[#C4364A] text-sm mb-4">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="btn-kurenai w-full py-3 rounded-lg text-lg font-bold tracking-[0.3em] disabled:opacity-50"
      >
        {loading ? '準備中...' : '対戦相手を募集する'}
      </button>
    </div>
  );
}
