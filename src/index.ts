import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import scrapeRouter from '@routes/scrape';
import storyRouter from '@routes/storyRouter';
import { StoryCollector } from './utils/storyCollector';
import configureSockets from './sockets';
import { resolve } from 'path';

const app = express();
const PORT = process.env.PORT || 3000;
const storyCollector = new StoryCollector();

app.use(express.json());
app.use(express.static(resolve(__dirname, './client/public')));

app.get('/index.html', (req, res) => {
  res.sendFile(resolve(__dirname, './client/index.html'));
});
app.get('/story.html', (_, res) => {
  res.sendFile(resolve(__dirname, './client/story.html'));
});
app.get('/allstories.html', (_, res) => {
  res.sendFile(resolve(__dirname, './client/allstories.html'));
});


app.use('/api/v0/scrape', scrapeRouter);
app.use('/api/v0/story', storyRouter);

// wss.on('connection', (ws) => {
//   console.log('New client connected');

//   ws.on('close', () => {
//     console.log('Client disconnected');
//   });
// });

storyCollector.start().catch((error) => {
  console.error('Failed to start story collector:', error);
});

configureSockets(
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  }),
);
