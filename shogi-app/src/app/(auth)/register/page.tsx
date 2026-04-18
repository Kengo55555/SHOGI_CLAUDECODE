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
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error?.message || 'エラー'); return; }
      if (data.verifyUrl) setVerifyUrl(data.verifyUrl);
    } catch { setError('通信エラー'); } finally { setLoading(false); }
  }

  if (verifyUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card-hana rounded-xl p-8 max-w-md w-full text-center">
          <div className="divider-hana w-24 mx-auto mb-6" />
          <h1 className="font-[family-name:var(--font-noto-serif)] text-2xl font-bold text-[#2D2226] mb-4">御登録</h1>
          <p className="text-[#2D2226]/60 mb-6 text-sm"><span className="text-[#C4364A] font-medium">{email}</span> で登録いたします</p>
          <a href={verifyUrl} className="btn-kurenai inline-block w-full py-3 rounded-lg text-lg tracking-[0.3em]">参 入</a>
          <p className="text-xs text-[#C4364A]/30 mt-4 font-serif">十五分以内にお済ませください</p>
          <div className="divider-hana w-24 mx-auto mt-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card-hana rounded-xl p-8 max-w-md w-full shadow-lg shadow-[#C4364A]/5">
        <div className="divider-hana w-24 mx-auto mb-6" />
        <h1 className="font-[family-name:var(--font-noto-serif)] text-3xl font-bold text-center mb-2 text-[#2D2226] tracking-wider">将棋処</h1>
        <p className="text-center text-[#C4364A]/50 mb-6 text-sm font-serif">御新規の方はこちらから</p>
        <form onSubmit={handleSubmit}>
          <label className="block text-xs font-medium mb-1 text-[#C4364A]/60 font-serif">御連絡先</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full bg-white border border-[#F4A7B9]/40 rounded-lg px-4 py-3 mb-4 text-[#2D2226] placeholder-[#C4364A]/25 focus:outline-none focus:border-[#C4364A]/60 focus:ring-2 focus:ring-[#C4364A]/10"
            placeholder="example@mail.com" />
          {error && <p className="text-[#C4364A] text-sm mb-4">{error}</p>}
          <button type="submit" disabled={loading} className="btn-kurenai w-full py-3 rounded-lg tracking-[0.2em] disabled:opacity-50">
            {loading ? '準備中...' : '登録 / ログイン'}
          </button>
        </form>
        <p className="text-center text-xs text-[#2D2226]/30 mt-4 font-serif">お馴染みの方もこちらからお入りいただけます</p>
        <div className="text-center mt-3">
          <Link href="/" className="text-xs text-[#C4364A]/40 hover:text-[#C4364A] transition-colors font-serif">表へ戻る</Link>
        </div>
        <div className="divider-hana w-24 mx-auto mt-6" />
      </div>
    </div>
  );
}
