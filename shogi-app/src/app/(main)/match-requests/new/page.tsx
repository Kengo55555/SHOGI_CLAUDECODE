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
      <h2 className="text-xl font-bold mb-6">対戦募集</h2>

      <section className="mb-6">
        <h3 className="text-sm font-medium mb-3">持ち時間</h3>
        <div className="space-y-2">
          {[
            { value: 10 as const, label: '10分切れ負け' },
            { value: 15 as const, label: '15分切れ負け' },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="timeControl"
                checked={timeControl === opt.value}
                onChange={() => setTimeControl(opt.value)}
                className="accent-[#2B4C7E]"
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </section>

      <p className="text-xs text-gray-500 mb-6">
        ※全登録ユーザーに通知が送信されます
      </p>

      {error && <p className="text-[#C41E3A] text-sm mb-4">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-[#2D5F2D] text-white py-3 rounded-lg font-medium hover:bg-[#245024] transition-colors disabled:opacity-50"
      >
        {loading ? '送信中...' : '対戦相手を募集する'}
      </button>
    </div>
  );
}
