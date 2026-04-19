'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [verifyUrl, setVerifyUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || 'エラーが発生しました');
        return;
      }

      if (data.verifyUrl) {
        setVerifyUrl(data.verifyUrl);
      } else {
        setError('このメールアドレスは登録されていません');
      }
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }

  if (verifyUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card-yukaku rounded-xl p-8 max-w-md w-full text-center">
          <div className="divider-hana w-24 mx-auto mb-6" />
          <h1 className="font-[family-name:var(--font-noto-serif)] text-2xl font-bold text-kinpaku mb-4">
            御入場
          </h1>
          <p className="text-[#F4E4C1]/60 mb-6 text-sm">
            <span className="text-[#D4A017] font-medium">{email}</span> でログインします
          </p>
          <a
            href={verifyUrl}
            className="btn-kurenai inline-block w-full py-3 rounded-lg text-lg tracking-[0.3em]"
          >
            入 場
          </a>
          <p className="text-xs text-[#D4A017]/30 mt-4 font-serif">
            十五分以内にお済ませください
          </p>
          <div className="divider-hana w-24 mx-auto mt-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card-yukaku rounded-xl p-8 max-w-md w-full shadow-lg shadow-black/20">
        <div className="divider-hana w-24 mx-auto mb-6" />
        <h1 className="font-[family-name:var(--font-noto-serif)] text-3xl font-bold text-center mb-2 text-kinpaku tracking-wider">
          将棋処
        </h1>
        <p className="text-center text-[#D4A017]/50 mb-6 text-sm font-serif">お馴染みの方はこちらから</p>

        <form onSubmit={handleSubmit}>
          <label className="block text-xs font-medium mb-1 text-[#D4A017]/60 font-serif">御連絡先</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-[#1A1118]/60 border border-[#D4A017]/20 rounded-lg px-4 py-3 mb-4 text-[#F4E4C1] placeholder-[#F4E4C1]/20 focus:outline-none focus:border-[#D4A017]/40 focus:ring-2 focus:ring-[#D4A017]/10"
            placeholder="example@mail.com"
          />

          {error && <p className="text-[#C4364A] text-sm mb-4">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-kurenai w-full py-3 rounded-lg tracking-[0.2em] disabled:opacity-50"
          >
            {loading ? '準備中...' : 'ログインリンクを取得'}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link href="/register" className="text-xs text-[#D4A017]/40 hover:text-[#D4A017] transition-colors font-serif">
            新規登録はこちら
          </Link>
        </div>
        <div className="divider-hana w-24 mx-auto mt-6" />
      </div>
    </div>
  );
}
