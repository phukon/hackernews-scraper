import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { db } from '@/config/db';
import { StoryTable } from '@/schema/story.schema';
import { and, desc, gte, sql } from 'drizzle-orm';

const HEARTBEAT_INTERVAL = 1000 * 5;
const HEARTBEAT_VALUE = 1;

type WSWithAlive = WebSocket & { isAlive: boolean };

let wss: WebSocketServer;

type NewStoryMessage = {
  type: 'NEW_STORY';
  data: {
    hackernews_id: number;
    title: string;
    url: string;
    by: string;
    score: number;
    descendants: number;
    hackernews_time: number;
  };
};

type InitialStatsMessage = {
  type: 'INITIAL_STATS';
  data: {
    recentStories: number;
    recentStoriesList: Array<{
      title: string;
      by: string;
      hackernews_id: number;
    }>;
    timestamp: Date;
  };
};

type BroadcastMessage = NewStoryMessage;

export function broadcast(message: BroadcastMessage) {
  if (!wss) return;
  
  const messageStr = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

function onSocketPreError(e: Error) {
    console.log(e);
}

function onSocketPostError(e: Error) {
    console.log(e);
}
function ping(ws: WebSocket) {
    ws.send(HEARTBEAT_VALUE, { binary: true });
}

async function sendInitialStats(ws: WebSocket) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  try {
    const [recentStoriesCount, recentStories] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(StoryTable)
        .where(and(gte(StoryTable.created_at, fiveMinutesAgo))),
      db
        .select({
          title: StoryTable.title,
          by: StoryTable.by,
          hackernews_id: StoryTable.hn_id,
        })
        .from(StoryTable)
        .where(and(gte(StoryTable.created_at, fiveMinutesAgo)))
        .orderBy(desc(StoryTable.created_at))
        .limit(10)
    ]);

    const message: InitialStatsMessage = {
      type: 'INITIAL_STATS',
      data: {
        recentStories: recentStoriesCount[0].count,
        recentStoriesList: recentStories,
        timestamp: new Date()
      }
    };

    ws.send(JSON.stringify(message));
  } catch (error) {
    console.error('Error sending initial stats:', error);
  }
}

export default function configure(s: Server) {
    wss = new WebSocketServer({ noServer: true });

    s.on('upgrade', (req, socket, head) => {
        socket.on('error', onSocketPreError);

        wss.handleUpgrade(req, socket, head, (ws) => {
            socket.removeListener('error', onSocketPreError);
            wss.emit('connection', ws, req);
        });
    });

    wss.on('connection', (ws: WebSocket, req) => {
        const aliveWS = ws as WSWithAlive;
        aliveWS.isAlive = true;

        sendInitialStats(ws);

        aliveWS.on('error', onSocketPostError);

        aliveWS.on('message', (msg, isBinary) => {
            if (isBinary && (msg as any)[0] === HEARTBEAT_VALUE) {
                aliveWS.isAlive = true;
            } else {
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(msg, { binary: isBinary });
                    }
                });
            }
        });

        aliveWS.on('close', () => {
            console.log('Connection closed');
        });
    });

    const interval = setInterval(() => {
        // console.log('firing interval');
        wss.clients.forEach((client) => {
            const aliveClient = client as WSWithAlive;
            if (!aliveClient.isAlive) {
                aliveClient.terminate();
                return;
            }

            aliveClient.isAlive = false;
            ping(aliveClient);
        });
    }, HEARTBEAT_INTERVAL);

    wss.on('close', () => {
        clearInterval(interval);
    });
}