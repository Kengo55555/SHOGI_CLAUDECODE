import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '../../src/types/socket';

type IOServer = Server<ClientToServerEvents, ServerToClientEvents>;
type IOSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

/** 接続中のユーザーとソケットのマッピング */
const userSocketMap = new Map<string, string>(); // userId -> socketId

export function setupMatchHandlers(io: IOServer, socket: IOSocket): void {
  // TODO: 認証ミドルウェアでsocket.data.userIdを設定

  socket.on('disconnect', () => {
    // ユーザーマッピングを削除
    for (const [userId, socketId] of userSocketMap) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        break;
      }
    }
  });
}

/** 特定ユーザーに通知を送信 */
export function sendToUser(io: IOServer, userId: string, event: string, data: unknown): void {
  const socketId = userSocketMap.get(userId);
  if (socketId) {
    io.to(socketId).emit(event as keyof ServerToClientEvents, data as never);
  }
}

/** 全接続ユーザーに通知をブロードキャスト */
export function broadcastToAll(io: IOServer, event: string, data: unknown): void {
  io.emit(event as keyof ServerToClientEvents, data as never);
}

/** ユーザーとソケットの紐付けを登録 */
export function registerUserSocket(userId: string, socketId: string): void {
  userSocketMap.set(userId, socketId);
}

/** ユーザーが接続中か確認 */
export function isUserOnline(userId: string): boolean {
  return userSocketMap.has(userId);
}
