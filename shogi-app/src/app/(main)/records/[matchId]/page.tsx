'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { GameState, Action } from '@/lib/shogi/core/types';
import { createGame, applyMove } from '@/lib/shogi/core';
import { ShogiBoard } from '@/components/board/ShogiBoard';
import { MochigomaBar } from '@/components/board/MochigomaBar';
import { getMochigoma } from '@/lib/shogi/core/board';

interface KifuData {
  matchId: string;
  kifText: string;
  moves: Action[];
  metadata: {
    sente: string;
    gote: string;
    timeControl: number;
    resultType: string;
    totalMoves: number;
    startedAt: string;
  };
}

export default function KifuReplayPage() {
  const params = useParams();
  const matchId = params.matchId as string;
  const [kifuData, setKifuData] = useState<KifuData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1); // -1 = 初期局面
  const [gameStates, setGameStates] = useState<GameState[]>([]);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/matches/${matchId}/kifu`)
      .then((res) => res.json())
      .then((data: KifuData) => {
        setKifuData(data);
        // 全局面を事前計算
        const states: GameState[] = [createGame()];
        let current = states[0];
        for (const move of data.moves) {
          const result = applyMove(current, move);
          if (result.success) {
            states.push(result.game);
            current = result.game;
          } else {
            break;
          }
        }
        setGameStates(states);
      })
      .finally(() => setLoading(false));
  }, [matchId]);

  // 自動再生
  useEffect(() => {
    if (!autoPlaying || !gameStates.length) return;
    const timer = setInterval(() => {
      setCurrentIndex((i) => {
        if (i >= gameStates.length - 2) {
          setAutoPlaying(false);
          return gameStates.length - 2;
        }
        return i + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoPlaying, gameStates.length]);

  const goToStart = useCallback(() => { setCurrentIndex(-1); setAutoPlaying(false); }, []);
  const goBack = useCallback(() => { setCurrentIndex((i) => Math.max(-1, i - 1)); setAutoPlaying(false); }, []);
  const goForward = useCallback(() => { setCurrentIndex((i) => Math.min(gameStates.length - 2, i + 1)); }, [gameStates.length]);
  const goToEnd = useCallback(() => { setCurrentIndex(gameStates.length - 2); setAutoPlaying(false); }, [gameStates.length]);

  if (loading) return <div className="text-center py-8 text-gray-500">読み込み中...</div>;
  if (!kifuData || gameStates.length === 0) {
    return <div className="text-center py-8 text-gray-500">棋譜が見つかりません</div>;
  }

  const displayState = gameStates[currentIndex + 1] || gameStates[0];
  const lastAction = currentIndex >= 0 ? kifuData.moves[currentIndex] : null;
  const lastMove = lastAction
    ? { from: lastAction.type === 'move' ? lastAction.from : undefined, to: lastAction.type === 'move' ? lastAction.to : lastAction.to }
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h2 className="text-lg font-bold mb-2">棋譜再生</h2>
      <p className="text-sm text-gray-600 mb-4">
        {kifuData.metadata.sente} vs {kifuData.metadata.gote}
        （{new Date(kifuData.metadata.startedAt).toLocaleDateString('ja-JP')}）
      </p>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* 盤面 */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-full max-w-[500px]">
            <MochigomaBar mochigoma={getMochigoma(displayState.boardState, 'gote')} owner="gote" isMyTurn={false} selectedPiece={null} onSelect={() => {}} />
          </div>
          <ShogiBoard
            boardState={displayState.boardState}
            perspective="sente"
            lastMove={lastMove}
            legalTargets={[]}
            selectedPosition={null}
            onSquareClick={() => {}}
          />
          <div className="w-full max-w-[500px]">
            <MochigomaBar mochigoma={getMochigoma(displayState.boardState, 'sente')} owner="sente" isMyTurn={false} selectedPiece={null} onSelect={() => {}} />
          </div>

          {/* コントロール */}
          <div className="flex items-center gap-2 mt-2">
            <button onClick={goToStart} className="px-3 py-1 border rounded text-sm hover:bg-gray-50">|◁</button>
            <button onClick={goBack} className="px-3 py-1 border rounded text-sm hover:bg-gray-50">◁</button>
            <button
              onClick={() => setAutoPlaying(!autoPlaying)}
              className={`px-4 py-1 border rounded text-sm ${autoPlaying ? 'bg-[#2B4C7E] text-white' : 'hover:bg-gray-50'}`}
            >
              {autoPlaying ? '■' : '▶'}
            </button>
            <button onClick={goForward} className="px-3 py-1 border rounded text-sm hover:bg-gray-50">▷</button>
            <button onClick={goToEnd} className="px-3 py-1 border rounded text-sm hover:bg-gray-50">▷|</button>
          </div>

          <p className="text-xs text-gray-500">
            {currentIndex + 1}手目 / {kifuData.metadata.totalMoves}手
          </p>
        </div>

        {/* 棋譜リスト */}
        <div className="lg:w-48 border rounded-lg p-2 max-h-[500px] overflow-y-auto bg-white">
          <div className="text-xs font-medium mb-2 text-gray-500">棋譜</div>
          {kifuData.kifText.split('\n').filter((l) => l.match(/^\s*\d+/)).map((line, i) => (
            <button
              key={i}
              onClick={() => { setCurrentIndex(i); setAutoPlaying(false); }}
              className={`block w-full text-left text-xs py-0.5 px-1 rounded ${
                i === currentIndex ? 'bg-[#2B4C7E] text-white' : 'hover:bg-gray-100'
              }`}
            >
              {line.trim()}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <Link href="/records" className="text-sm text-[#2B4C7E] hover:underline">
          ← 戦績一覧に戻る
        </Link>
      </div>
    </div>
  );
}
