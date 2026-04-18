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
    return <div className="max-w-md mx-auto px-4 py-8 text-center text-gray-500">読み込み中...</div>;
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h2 className="text-xl font-bold mb-6">プロフィール設定</h2>

      <form onSubmit={handleSave}>
        <label className="block text-sm font-medium mb-1">ハンドルネーム</label>
        <input
          type="text"
          value={handleName}
          onChange={(e) => setHandleName(e.target.value)}
          maxLength={20}
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-1 focus:outline-none focus:ring-2 focus:ring-[#2B4C7E]"
        />
        <p className="text-xs text-gray-500 mb-4">1〜20文字</p>

        <label className="block text-sm font-medium mb-1">メールアドレス</label>
        <p className="text-gray-600 mb-6">{email}</p>

        {message && <p className="text-sm mb-4 text-[#2B4C7E]">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[#2D5F2D] text-white py-2 rounded-lg font-medium hover:bg-[#245024] transition-colors disabled:opacity-50 mb-4"
        >
          {saving ? '保存中...' : '保存する'}
        </button>
      </form>

      <button
        onClick={handleLogout}
        className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors mb-8"
      >
        ログアウト
      </button>

      <hr className="mb-6" />

      {!showDeleteConfirm ? (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full border border-[#C41E3A] text-[#C41E3A] py-2 rounded-lg text-sm hover:bg-red-50 transition-colors"
        >
          退会する
        </button>
      ) : (
        <div className="bg-red-50 border border-[#C41E3A] rounded-lg p-4">
          <p className="text-sm text-[#C41E3A] mb-3">本当に退会しますか？この操作は取り消せません。</p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="flex-1 bg-[#C41E3A] text-white py-2 rounded-lg text-sm"
            >
              退会する
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 border border-gray-300 py-2 rounded-lg text-sm"
            >
              戻る
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
