interface WebSocketExt extends WebSocket {
  pingTimeout: NodeJS.Timeout;
}

interface StoryMessage {
    title: string;
    author: string;
    hackernewsId: string;
}

(function () {
  let ws: WebSocketExt;
  const HEARTBEAT_TIMEOUT = ((1000 * 5) + (1000 * 1));
  const HEARTBEAT_VALUE = 1;
  const messages = <HTMLElement>document.getElementById('messages');
  const wsOpen = <HTMLButtonElement>document.getElementById('ws-open');
  // const wsClose = <HTMLButtonElement>document.getElementById('ws-close');
  // const wsSend = <HTMLButtonElement>document.getElementById('ws-send');
  // const wsInput = <HTMLInputElement>document.getElementById('ws-input');
  const recentStories = <HTMLElement>document.getElementById('recent-stories');
  const lastUpdate = <HTMLElement>document.getElementById('last-update');

  function showMessage(message: string | StoryMessage) {
      if (!messages) {
          return;
      }

      if (typeof message === 'object') {
          const storyLink = `<div class="story-entry">
              <a href="/story.html?id=${message.hackernewsId}" class="story-link">${message.title}</a>
              <span class="story-author">by ${message.author}</span>
          </div>`;
          messages.innerHTML += storyLink;
      } else {
          messages.textContent += `\n${message}`;
      }
      
      messages.scrollTop = messages?.scrollHeight;
  }

  function closeConnection() {
      if (!!ws) {
          ws.close();
      }
  }

  function heartbeat() {
      if (!ws) {
          return;
      } else if (!!ws.pingTimeout) {
          clearTimeout(ws.pingTimeout);
      }

      ws.pingTimeout = setTimeout(() => {
          ws.close();

      }, HEARTBEAT_TIMEOUT);

      const data = new Uint8Array(1);

      data[0] = HEARTBEAT_VALUE;

      ws.send(data);
  }

  function isBinary(obj: any) {
      return typeof obj === 'object' && Object.prototype.toString.call(obj) === '[object Blob]';
  }

  function updateStats(stats: { recentStories: number, timestamp: string }) {
      if (recentStories) {
          recentStories.textContent = stats.recentStories.toString();
      }
      if (lastUpdate) {
          const time = new Date(stats.timestamp).toLocaleTimeString();
          lastUpdate.textContent = time;
      }
  }

  function initializeWebSocket() {
      closeConnection();

      ws = new WebSocket('ws://localhost:3000') as WebSocketExt;

      ws.addEventListener('error', () => {
          showMessage('WebSocket error');
      });

      ws.addEventListener('open', () => {
          showMessage('WebSocket connection established');
      });

      ws.addEventListener('close', () => {
          showMessage('WebSocket connection closed');

          if (!!ws.pingTimeout) {
              clearTimeout(ws.pingTimeout);
          }
      });

      ws.addEventListener('message', (msg: MessageEvent<string>) => {
          if (isBinary(msg.data)) {
              heartbeat();
          } else {
              const data = JSON.parse(msg.data);
              switch (data.type) {
                  case 'NEW_STORY':
                      showMessage({
                          title: `${data.data.title} (id:${data.data.hackernews_id})`,
                          author: data.data.by,
                          hackernewsId: data.data.hackernews_id
                      });
                      updateStats({
                          recentStories: data.data.recentStoriesCount,
                          timestamp: new Date().toISOString()
                      });
                      break;
                  case 'INITIAL_STATS':
                      updateStats({
                          recentStories: data.data.recentStories,
                          timestamp: data.data.timestamp
                      });
                      break;
                  default:
                      showMessage(`Received message: ${msg.data}`);
              }
          }
      });
  }

  initializeWebSocket();

  // Update click handlers
  wsOpen.addEventListener('click', initializeWebSocket);
  // wsClose.addEventListener('click', closeConnection);

  // wsSend.addEventListener('click', () => {
  //     const val = wsInput?.value;

  //     if (!val) {
  //         return;
  //     } else if (!ws) {
  //         showMessage('No WebSocket connection');
  //         return;
  //     }

  //     ws.send(val);
  //     showMessage(`Sent "${val}"`);
  //     wsInput.value = '';
  // });
})();