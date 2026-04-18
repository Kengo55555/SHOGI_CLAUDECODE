'use client';

import { useParams } from 'next/navigation';
import { GameScreen } from '@/components/game/GameScreen';

export default function GamePage() {
  const params = useParams();
  const matchId = params.matchId as string;

  // TODO: matchIdからDBの対局情報を取得して正しい値を渡す
  // MVP版はCPU対戦のデフォルト値で動作確認

  return (
    <GameScreen
      matchId={matchId}
      isCpuGame={true}
      cpuLevel={1}
      myPlayer="sente"
      timeControlMinutes={15}
      opponentName="CPU（初級）"
      myName="あなた"
    />
  );
}
