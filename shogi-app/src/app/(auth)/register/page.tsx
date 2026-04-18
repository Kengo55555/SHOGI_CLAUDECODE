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

      if (!res.ok) {
        setError(data.error?.message || 'エラーが発生しました');
        return;
      }

      if (data.verifyUrl) {
        setVerifyUrl(data.verifyUrl);
      }
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }

  if (verifyUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <h1 className="font-[family-name:var(--font-noto-serif)] text-2xl font-bold mb-4">
            登録を完了する
          </h1>
          <p className="text-gray-600 mb-6">
            <span className="font-medium text-[#1A1A1A]">{email}</span> で登録します。
          </p>
          <a
            href={verifyUrl}
            className="inline-block w-full bg-[#2D5F2D] text-white py-3 rounded-lg font-medium hover:bg-[#245024] transition-colors"
          >
            認証してログイン
          </a>
          <p className="text-xs text-gray-400 mt-4">
            リンクの有効期限は15分です
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] px-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full">
        <h1 className="font-[family-name:var(--font-noto-serif)] text-2xl font-bold text-center mb-6">
          将棋オンライン
        </h1>
        <p className="text-center text-gray-600 mb-6">メールアドレスで始める</p>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium mb-1">メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#2B4C7E] focus:border-transparent"
            placeholder="example@mail.com"
          />

          {error && <p className="text-[#C41E3A] text-sm mb-4">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2D5F2D] text-white py-2 rounded-lg font-medium hover:bg-[#245024] transition-colors disabled:opacity-50"
          >
            {loading ? '送信中...' : '登録 / ログイン'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          登録済みの方もこちらからログインできます
        </p>

        <div className="text-center mt-4">
          <Link href="/" className="text-sm text-[#2B4C7E] hover:underline">
            トップページへ戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
