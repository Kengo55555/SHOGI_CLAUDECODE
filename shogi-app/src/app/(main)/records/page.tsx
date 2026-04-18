'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface MatchRecord {
  id: string;
  opponent: { type: 'human'; handleName: string } | { type: 'cpu'; level: number };
  mySide: 'sente' | 'gote';
  result: 'win' | 'lose' | 'draw';
  resultType: string;
  totalMoves: number;
  timeControl: number;
  startedAt: string;
  endedAt: string;
}

interface Summary {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
}

const CPU_LEVELS: Record<number, string> = { 1: '初級', 2: '中級', 3: '上級' };
const RESULT_TYPES: Record<string, string> = {
  checkmate: '詰み', resign: '投了', timeout: '時間切れ',
  disconnect: '接続断', draw: '引き分け', cpu_win: 'CPU勝ち',
};

export default function RecordsPage() {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalGames: 0, wins: 0, losses: 0, draws: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/matches')
      .then((res) => res.json())
      .then((data) => {
        setMatches(data.matches || []);
        setSummary(data.summary || { totalGames: 0, wins: 0, losses: 0, draws: 0 });
      })
      .finally(() => setLoading(false));
  }, []);

  const winRate = summary.totalGames > 0
    ? ((summary.wins / (summary.totalGames - summary.draws)) * 100).toFixed(1)
    : '0.0';

  if (loading) return <div className="max-w-lg mx-auto px-4 py-8 text-center text-gray-500">読み込み中...</div>;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h2 className="text-xl font-bold mb-4">戦績</h2>

      {/* サマリ */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="text-sm text-gray-600">
          通算: {summary.totalGames}戦 {summary.wins}勝 {summary.losses}敗 {summary.draws}分
        </div>
        <div className="text-sm text-gray-600">
          勝率: {winRate}%
        </div>
      </div>

      {/* 対局一覧 */}
      {matches.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
          まだ対局記録がありません
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => {
            const opponentName = m.opponent.type === 'human'
              ? m.opponent.handleName
              : `CPU（${CPU_LEVELS[m.opponent.level] || '不明'}）`;
            const resultIcon = m.result === 'win' ? '◯' : m.result === 'lose' ? '✕' : '△';
            const resultColor = m.result === 'win' ? 'text-[#B8860B]' : m.result === 'lose' ? 'text-gray-500' : 'text-gray-600';
            const resultLabel = m.result === 'win' ? '勝ち' : m.result === 'lose' ? '負け' : '引き分け';
            const date = new Date(m.startedAt);
            const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

            return (
              <div key={m.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">{dateStr}</span>
                  <span className="text-xs text-gray-500">{m.timeControl}分切れ負け</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm">vs {opponentName}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {m.mySide === 'sente' ? '☗先手' : '☖後手'}
                    </span>
                  </div>
                  <Link href={`/records/${m.id}`} className="text-xs text-[#2B4C7E] hover:underline">
                    棋譜を見る
                  </Link>
                </div>
                <div className={`text-sm font-medium mt-1 ${resultColor}`}>
                  {resultIcon} {resultLabel}（{RESULT_TYPES[m.resultType] || m.resultType}・{m.totalMoves}手）
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
