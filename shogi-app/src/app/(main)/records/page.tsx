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

  if (loading) return <div className="max-w-lg mx-auto px-4 py-8 text-center text-[#F4E4C1]/50">読み込み中...</div>;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h2 className="font-[family-name:var(--font-noto-serif)] text-xl font-bold mb-4 text-kinpaku tracking-wider text-center">戦績帳</h2>

      {/* サマリ */}
      <div className="card-yukaku rounded-xl p-4 mb-6">
        <div className="text-sm text-[#F4E4C1]/70">
          通算: {summary.totalGames}戦 {summary.wins}勝 {summary.losses}敗 {summary.draws}分
        </div>
        <div className="text-sm text-[#D4A017]/70">
          勝率: {winRate}%
        </div>
      </div>

      {/* 対局一覧 */}
      {matches.length === 0 ? (
        <div className="card-yukaku rounded-xl p-8 text-center text-[#F4E4C1]/35 text-sm font-serif">
          まだ対局記録がありません
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => {
            const opponentName = m.opponent.type === 'human'
              ? m.opponent.handleName
              : `CPU（${CPU_LEVELS[m.opponent.level] || '不明'}）`;
            const resultIcon = m.result === 'win' ? '◯' : m.result === 'lose' ? '✕' : '△';
            const resultColor = m.result === 'win' ? 'text-[#D4A017]' : m.result === 'lose' ? 'text-[#F4E4C1]/40' : 'text-[#F4E4C1]/60';
            const resultLabel = m.result === 'win' ? '勝ち' : m.result === 'lose' ? '負け' : '引き分け';
            const date = new Date(m.startedAt);
            const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

            return (
              <div key={m.id} className="card-yukaku rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#F4E4C1]/40">{dateStr}</span>
                  <span className="text-xs text-[#F4E4C1]/40">{m.timeControl}分切れ負け</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-[#F4E4C1]">vs {opponentName}</span>
                    <span className="text-xs text-[#D4A017]/50 ml-2">
                      {m.mySide === 'sente' ? '☗先手' : '☖後手'}
                    </span>
                  </div>
                  <Link href={`/records/${m.id}`} className="text-xs text-[#D4A017]/70 hover:text-[#D4A017] transition-colors">
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
