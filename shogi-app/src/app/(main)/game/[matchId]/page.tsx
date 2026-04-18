'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GameScreen } from '@/components/game/GameScreen';
import type { Player } from '@/lib/shogi/core/types';

const CPU_NAMES: Record<number, string> = { 1: 'CPU（初級）', 2: 'CPU（中級）', 3: 'CPU（上級）' };

interface MatchData {
  id: string;
  userId: string;
  cpuLevel: number | null;
  timeControl: number;
  playerSide: Player;
  myName: string;
  opponentName: string;
  isCpu: boolean;
}

export default function GamePage() {
  const params = useParams();
  const matchId = params.matchId as string;
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // URLパラメータからplayerSideを取得（CPU対戦開始時に設定）
    const searchParams = new URLSearchParams(window.location.search);
    const sideParam = searchParams.get('side') as Player | null;

    fetch(`/api/matches/${matchId}`)
      .then((res) => {
        if (!res.ok) throw new Error('対局が見つかりません');
        return res.json();
      })
      .then((data) => {
        const isCpu = data.cpuLevel !== null;
        const playerSide = sideParam || 'sente';

        setMatchData({
          id: data.id,
          userId: data.sente?.id || '',
          cpuLevel: data.cpuLevel,
          timeControl: data.timeControl,
          playerSide,
          myName: data.sente?.handleName || 'あなた',
          opponentName: isCpu
            ? CPU_NAMES[data.cpuLevel] || 'CPU'
            : data.gote?.handleName || '対戦相手',
          isCpu,
        });
      })
      .catch(() => setError('対局データの読み込みに失敗しました'));
  }, [matchId]);

  if (error) {
    return <div className="text-center py-8 text-[#C41E3A]">{error}</div>;
  }

  if (!matchData) {
    return <div className="text-center py-8 text-gray-500">読み込み中...</div>;
  }

  return (
    <GameScreen
      matchId={matchId}
      userId={matchData.userId}
      isCpuGame={matchData.isCpu}
      cpuLevel={matchData.cpuLevel as 1 | 2 | 3 | undefined}
      myPlayer={matchData.playerSide}
      timeControlMinutes={matchData.timeControl}
      opponentName={matchData.opponentName}
      myName={matchData.myName}
    />
  );
}
