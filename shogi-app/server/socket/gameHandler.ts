import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, TimeRemaining } from '../../src/types/socket';

type IOServer = Server<ClientToServerEvents, ServerToClientEvents>;
type IOSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

/** 対局ルーム管理（インメモリ） */
export interface GameRoom {
  matchId: string;
  senteSocketId: string | null;
  goteSocketId: string | null;
  senteTimeRemaining: number;  // ミリ秒
  goteTimeRemaining: number;
  lastMoveTimestamp: number;
  timerId: ReturnType<typeof setInterval> | null;
  disconnectTimerId: ReturnType<typeof setTimeout> | null;
}

const gameRooms = new Map<string, GameRoom>();

/** ルームを取得または作成 */
export function getOrCreateRoom(matchId: string, timeControlMinutes: number): GameRoom {
  let room = gameRooms.get(matchId);
  if (!room) {
    room = {
      matchId,
      senteSocketId: null,
      goteSocketId: null,
      senteTimeRemaining: timeControlMinutes * 60 * 1000,
      goteTimeRemaining: timeControlMinutes * 60 * 1000,
      lastMoveTimestamp: Date.now(),
      timerId: null,
      disconnectTimerId: null,
    };
    gameRooms.set(matchId, room);
  }
  return room;
}

/** ルームを削除 */
export function removeRoom(matchId: string): void {
  const room = gameRooms.get(matchId);
  if (room) {
    if (room.timerId) clearInterval(room.timerId);
    if (room.disconnectTimerId) clearTimeout(room.disconnectTimerId);
    gameRooms.delete(matchId);
  }
}

/** ルームを取得 */
export function getRoom(matchId: string): GameRoom | undefined {
  return gameRooms.get(matchId);
}

export function setupSocketHandlers(io: IOServer, socket: IOSocket): void {
  socket.on('join_match', ({ matchId }) => {
    socket.join(matchId);
    console.log(`[Game] Socket ${socket.id} joined match ${matchId}`);

    // TODO: ゲーム状態をDBから復元してmatch_joinedを送信
    // 対局進行の詳細実装はDD-04で行う
  });

  socket.on('move', ({ from, to, promote }) => {
    // TODO: 将棋エンジンで合法性検証 → 盤面更新 → 両者に配信
    // DD-01（将棋エンジン）とDD-04（オンライン対戦）で実装
    console.log(`[Game] Move from ${socket.id}: ${JSON.stringify({ from, to, promote })}`);
  });

  socket.on('drop', ({ piece, to }) => {
    // TODO: 持ち駒打ちの処理
    console.log(`[Game] Drop from ${socket.id}: ${piece} to ${JSON.stringify(to)}`);
  });

  socket.on('resign', () => {
    // TODO: 投了処理
    console.log(`[Game] Resign from ${socket.id}`);
  });
}
