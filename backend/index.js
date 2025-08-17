import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

const VOUCHERS_PATH = path.join(process.cwd(), 'vouchers.json');
let sessions = {}; // { sessionId: socketId }

// API: Create session and return sessionId
app.post('/api/session', (req, res) => {
  const sessionId = Math.random().toString(36).substr(2, 9);
  sessions[sessionId] = null;
  res.json({ sessionId });
});

// API: Get all vouchers
app.get('/api/vouchers', (req, res) => {
  const vouchers = JSON.parse(fs.readFileSync(VOUCHERS_PATH));
  res.json(vouchers);
});

// WebSocket connection
io.on('connection', (socket) => {
  socket.on('register-desktop', (sessionId) => {
    sessions[sessionId] = socket.id;
  });

  socket.on('scan-qr', ({ sessionId }) => {
    const vouchers = JSON.parse(fs.readFileSync(VOUCHERS_PATH));
    socket.emit('voucher-list', vouchers);
    // Notify desktop
    const desktopSocketId = sessions[sessionId];
    if (desktopSocketId) {
      io.to(desktopSocketId).emit('voucher-taken', { sessionId });
    }
  });

  socket.on('disconnect', () => {
    // Clean up sessions
    for (const [sessionId, sockId] of Object.entries(sessions)) {
      if (sockId === socket.id) {
        delete sessions[sessionId];
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
