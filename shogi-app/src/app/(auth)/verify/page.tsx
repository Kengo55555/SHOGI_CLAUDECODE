'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setErrorMessage('トークンが指定されていません');
      return;
    }

    fetch(`/api/auth/verify?token=${token}`, { redirect: 'manual' })
      .then((res) => {
        if (res.type === 'opaqueredirect' || res.status === 302 || res.redirected) {
          setStatus('success');
          window.location.href = '/dashboard';
        } else {
          return res.json().then((data) => {
            setStatus('error');
            setErrorMessage(data.error?.message || '認証に失敗しました');
          });
        }
      })
      .catch(() => {
        setStatus('error');
        setErrorMessage('通信エラーが発生しました');
      });
  }, [searchParams]);

  if (status === 'loading') {
    return <p className="text-gray-600">認証中...</p>;
  }

  if (status === 'error') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
        <h1 className="text-xl font-bold text-[#C41E3A] mb-4">認証エラー</h1>
        <p className="text-gray-600 mb-4">{errorMessage}</p>
        <Link href="/register" className="text-[#2B4C7E] hover:underline">
          もう一度やり直す
        </Link>
      </div>
    );
  }

  return <p className="text-gray-600">ダッシュボードに移動中...</p>;
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] px-4">
      <Suspense fallback={<p className="text-gray-600">読み込み中...</p>}>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
