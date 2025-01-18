import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import { pingRouter } from './api/routes/ping';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api/v0/ping', pingRouter);

wss.on('connection', (ws) => {
  console.log('New client connected');
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

export const startServer = () => {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}; 