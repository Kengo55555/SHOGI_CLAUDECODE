'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface MatchRequest {
  id: string;
  requester: { id: string; handleName: string };
  timeControl: number;
  expiresAt: string;
  createdAt: string;
}

export default function MatchRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<MatchRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10_000); // 10秒ごとに更新
    return () => clearInterval(interval);
  }, []);

  async function fetchRequests() {
    try {
      const res = await fetch('/api/match-requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(id: string) {
    try {
      const res = await fetch(`/api/match-requests/${id}/accept`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        router.push(`/game/${data.matchId}`);
      } else {
        const err = await res.json();
        alert(err.error?.message || 'エラーが発生しました');
        fetchRequests();
      }
    } catch {
      alert('通信エラーが発生しました');
    }
  }

  function getRemainingMinutes(expiresAt: string): string {
    const remaining = Math.max(0, new Date(expiresAt).getTime() - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">対戦募集一覧</h2>
        <Link
          href="/match-requests/new"
          className="bg-[#2D5F2D] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#245024] transition-colors"
        >
          募集する
        </Link>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-8">読み込み中...</div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
          現在対戦募集はありません
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{req.requester.handleName}</span>
                <span className="text-xs text-gray-500">
                  残り {getRemainingMinutes(req.expiresAt)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{req.timeControl}分切れ負け</p>
              <button
                onClick={() => handleAccept(req.id)}
                className="w-full bg-[#2B4C7E] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#1E3A5F] transition-colors"
              >
                対戦する
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
