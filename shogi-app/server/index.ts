import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { setupSocketHandlers } from './socket/gameHandler';
import { setupMatchHandlers } from './socket/matchHandler';
import type { ClientToServerEvents, ServerToClientEvents } from '../src/types/socket';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
const wsPort = parseInt(process.env.WS_PORT || '3001', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Next.js HTTPサーバー
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Socket.IOサーバー（別ポート）
  const wsServer = createServer();
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(wsServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`,
      credentials: true,
    },
  });

  // Socket.IOイベントハンドラを登録
  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    setupSocketHandlers(io, socket);
    setupMatchHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}, reason: ${reason}`);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Next.js ready on http://${hostname}:${port}`);
  });

  wsServer.listen(wsPort, () => {
    console.log(`> Socket.IO ready on ws://${hostname}:${wsPort}`);
  });
});
