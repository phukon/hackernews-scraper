import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import scrapeRouter from './api/routes/scrape';
import { StoryCollector } from './utils/storyCollector';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 3000;
const storyCollector = new StoryCollector();

app.use(express.json());

app.use('/api/v0/scrape', scrapeRouter);

wss.on('connection', (ws) => {
  console.log('New client connected');
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Start the story collector when the server starts
storyCollector.start().catch(error => {
  console.error('Failed to start story collector:', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  storyCollector.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});