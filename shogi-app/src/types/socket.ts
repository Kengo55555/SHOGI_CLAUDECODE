import type { Action, GameState, Player } from '@/lib/shogi/core/types';

// ==========================================
// Socket.IO イベント型定義
// ==========================================

/** クライアント → サーバー */
export interface ClientToServerEvents {
  join_match: (payload: { matchId: string }) => void;
  move: (payload: { from: { suji: number; dan: number }; to: { suji: number; dan: number }; promote: boolean }) => void;
  drop: (payload: { piece: string; to: { suji: number; dan: number } }) => void;
  resign: () => void;
}

/** サーバー → クライアント */
export interface ServerToClientEvents {
  authenticated: () => void;
  auth_error: (payload: { message: string }) => void;
  match_joined: (payload: { gameState: GameState }) => void;
  move_accepted: (payload: { action: Action; gameState: GameState; timeRemaining: TimeRemaining }) => void;
  move_rejected: (payload: { reason: string }) => void;
  game_over: (payload: GameOverPayload) => void;
  time_update: (payload: TimeRemaining) => void;
  opponent_disconnected: (payload: { timeout: number }) => void;
  opponent_reconnected: () => void;
  cpu_thinking: () => void;
  notification_new: (payload: NotificationPayload) => void;
}

/** 残り時間 */
export interface TimeRemaining {
  sente: number; // ミリ秒
  gote: number;
}

/** 対局終了ペイロード */
export interface GameOverPayload {
  result: string;
  winner: Player | null;
  resultType: string;
}

/** 通知ペイロード */
export interface NotificationPayload {
  id: string;
  type: 'match_request' | 'match_accepted' | 'match_result' | 'request_expired';
  title: string;
  body: string;
  referenceId: string;
  createdAt: string;
}
