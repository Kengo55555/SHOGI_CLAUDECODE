'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [handleName, setHandleName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetch('/api/users/me')
      .then((res) => res.json())
      .then((data) => {
        setHandleName(data.handleName || '');
        setEmail(data.email || '');
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handleName }),
      });

      if (res.ok) {
        setMessage('保存しました');
      } else {
        const data = await res.json();
        setMessage(data.error?.message || 'エラーが発生しました');
      }
    } catch {
      setMessage('通信エラーが発生しました');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch('/api/users/me', { method: 'DELETE' });
      if (res.ok) {
        router.push('/');
      } else {
        const data = await res.json();
        setMessage(data.error?.message || '退会処理に失敗しました');
      }
    } catch {
      setMessage('通信エラーが発生しました');
    }
    setShowDeleteConfirm(false);
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  if (loading) {
    return <div className="max-w-md mx-auto px-4 py-8 text-center text-[#F4E4C1]/50">読み込み中...</div>;
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h2 className="font-[family-name:var(--font-noto-serif)] text-xl font-bold mb-6 text-kinpaku tracking-wider text-center">御設定</h2>

      <form onSubmit={handleSave}>
        <label className="block text-xs font-medium mb-1 text-[#D4A017]/70 font-serif">ハンドルネーム</label>
        <input
          type="text"
          value={handleName}
          onChange={(e) => setHandleName(e.target.value)}
          maxLength={20}
          required
          className="w-full bg-[#1A1118]/60 border border-[#D4A017]/20 rounded-lg px-4 py-2 mb-1 text-[#F4E4C1] placeholder-[#F4E4C1]/20 focus:outline-none focus:ring-2 focus:ring-[#D4A017]/30 focus:border-[#D4A017]/40"
        />
        <p className="text-xs text-[#F4E4C1]/30 mb-4 font-serif">1〜20文字</p>

        <label className="block text-xs font-medium mb-1 text-[#D4A017]/70 font-serif">メールアドレス</label>
        <p className="text-[#F4E4C1]/60 mb-6">{email}</p>

        {message && <p className="text-sm mb-4 text-[#D4A017]">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="btn-kurenai w-full py-2 rounded-lg font-medium disabled:opacity-50 mb-4"
        >
          {saving ? '保存中...' : '保存する'}
        </button>
      </form>

      <button
        onClick={handleLogout}
        className="w-full border border-[#F4E4C1]/20 text-[#F4E4C1]/60 py-2 rounded-lg font-medium hover:bg-[#F4E4C1]/5 transition-colors mb-8"
      >
        ログアウト
      </button>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#D4A017]/20 to-transparent mb-6" />

      {!showDeleteConfirm ? (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full border border-[#C4364A]/40 text-[#C4364A]/70 py-2 rounded-lg text-sm hover:bg-[#C4364A]/5 transition-colors"
        >
          退会する
        </button>
      ) : (
        <div className="bg-[#C4364A]/10 border border-[#C4364A]/40 rounded-lg p-4">
          <p className="text-sm text-[#C4364A] mb-3">本当に退会しますか？この操作は取り消せません。</p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="flex-1 bg-[#C4364A] text-[#FFF8F0] py-2 rounded-lg text-sm"
            >
              退会する
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 border border-[#F4E4C1]/20 text-[#F4E4C1]/60 py-2 rounded-lg text-sm"
            >
              戻る
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
