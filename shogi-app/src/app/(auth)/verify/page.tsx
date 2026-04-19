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
    return <p className="text-[#F4E4C1]/60 font-serif">認証中...</p>;
  }

  if (status === 'error') {
    return (
      <div className="card-yukaku rounded-xl p-8 max-w-md w-full text-center">
        <h1 className="text-xl font-bold text-[#C4364A] mb-4 font-serif">認証エラー</h1>
        <p className="text-[#F4E4C1]/60 mb-4">{errorMessage}</p>
        <Link href="/register" className="text-[#D4A017]/70 hover:text-[#D4A017] transition-colors font-serif">
          もう一度やり直す
        </Link>
      </div>
    );
  }

  return <p className="text-[#F4E4C1]/60 font-serif">ダッシュボードに移動中...</p>;
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Suspense fallback={<p className="text-[#F4E4C1]/60 font-serif">読み込み中...</p>}>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
