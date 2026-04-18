'use client';

import { useState, useEffect } from 'react';

interface NotificationSettings {
  emailEnabled: boolean;
  siteEnabled: boolean;
  lineEnabled: boolean;
  slackEnabled: boolean;
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    emailEnabled: false,
    siteEnabled: true,
    lineEnabled: false,
    slackEnabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/notifications/settings')
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/notifications/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setMessage('保存しました');
      }
    } catch {
      setMessage('エラーが発生しました');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="max-w-md mx-auto px-4 py-8 text-center text-gray-500">読み込み中...</div>;

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h2 className="text-xl font-bold mb-6">通知設定</h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between py-3">
          <div>
            <div className="font-medium text-sm">サイト内通知</div>
            <div className="text-xs text-gray-500">常時有効</div>
          </div>
          <div className="text-sm text-green-600 font-medium">ON</div>
        </div>

        <div className="flex items-center justify-between py-3 border-t">
          <div>
            <div className="font-medium text-sm">メール通知</div>
            <div className="text-xs text-gray-500">対戦募集・応諾・結果をメールでお知らせ</div>
          </div>
          <button
            onClick={() => setSettings((s) => ({ ...s, emailEnabled: !s.emailEnabled }))}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.emailEnabled ? 'bg-[#2D5F2D]' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings.emailEnabled ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between py-3 border-t opacity-50">
          <div>
            <div className="font-medium text-sm">LINE通知（準備中）</div>
          </div>
          <div className="text-xs text-gray-400">2ndリリース</div>
        </div>

        <div className="flex items-center justify-between py-3 border-t opacity-50">
          <div>
            <div className="font-medium text-sm">Slack通知（準備中）</div>
          </div>
          <div className="text-xs text-gray-400">2ndリリース</div>
        </div>
      </div>

      {message && <p className="text-sm text-[#2B4C7E] mt-4">{message}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full mt-6 bg-[#2D5F2D] text-white py-2 rounded-lg font-medium hover:bg-[#245024] transition-colors disabled:opacity-50"
      >
        {saving ? '保存中...' : '保存する'}
      </button>
    </div>
  );
}
