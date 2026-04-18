'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [verifyUrl, setVerifyUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error?.message || 'エラーが発生しました'); return; }
      if (data.verifyUrl) setVerifyUrl(data.verifyUrl);
    } catch { setError('通信エラーが発生しました'); } finally { setLoading(false); }
  }

  if (verifyUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-seigaiha">
        <div className="card-urushi rounded-lg p-8 max-w-md w-full text-center">
          <div className="divider-kinpaku w-24 mx-auto mb-6" />
          <h1 className="font-[family-name:var(--font-noto-serif)] text-2xl font-bold text-kinpaku mb-4">
            御登録
          </h1>
          <p className="text-[#F0E6D3]/70 mb-6 text-sm">
            <span className="text-[#F4A7B9]">{email}</span> で登録いたします
          </p>
          <a href={verifyUrl} className="btn-kurenai inline-block w-full py-3 rounded-lg text-lg font-bold tracking-widest">
            参 入
          </a>
          <p className="text-xs text-[#D4A017]/30 mt-4">十五分以内にお済ませください</p>
          <div className="divider-kinpaku w-24 mx-auto mt-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-seigaiha">
      <div className="card-urushi rounded-lg p-8 max-w-md w-full">
        <div className="divider-kinpaku w-24 mx-auto mb-6" />
        <h1 className="font-[family-name:var(--font-noto-serif)] text-3xl font-bold text-center mb-2 text-kinpaku tracking-wider">
          将棋処
        </h1>
        <p className="text-center text-[#F0E6D3]/50 mb-6 text-sm font-serif">御新規の方はこちらから</p>

        <form onSubmit={handleSubmit}>
          <label className="block text-xs font-medium mb-1 text-[#D4A017]/70">御連絡先</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-[#0D0D0D] border border-[#D4A017]/20 rounded-lg px-4 py-3 mb-4 text-[#F0E6D3] placeholder-[#F0E6D3]/20 focus:outline-none focus:border-[#D4A017]/60 focus:ring-1 focus:ring-[#D4A017]/30"
            placeholder="example@mail.com"
          />
          {error && <p className="text-[#C41E3A] text-sm mb-4">{error}</p>}
          <button type="submit" disabled={loading} className="btn-kurenai w-full py-3 rounded-lg font-bold tracking-wider disabled:opacity-50">
            {loading ? '準備中...' : '登録 / ログイン'}
          </button>
        </form>

        <p className="text-center text-xs text-[#F0E6D3]/30 mt-4">
          お馴染みの方もこちらからお入りいただけます
        </p>
        <div className="text-center mt-3">
          <Link href="/" className="text-xs text-[#D4A017]/40 hover:text-[#D4A017] transition-colors">
            表へ戻る
          </Link>
        </div>
        <div className="divider-kinpaku w-24 mx-auto mt-6" />
      </div>
    </div>
  );
}
