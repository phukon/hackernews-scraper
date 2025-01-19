import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

const HEARTBEAT_INTERVAL = 1000 * 5;
const HEARTBEAT_VALUE = 1;

type WSWithAlive = WebSocket & { isAlive: boolean };

function onSocketPreError(e: Error) {
    console.log(e);
}

function onSocketPostError(e: Error) {
    console.log(e);
}

function ping(ws: WebSocket) {
    ws.send(HEARTBEAT_VALUE, { binary: true });
}

export default function configure(s: Server) {
    const wss = new WebSocketServer({ noServer: true });

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