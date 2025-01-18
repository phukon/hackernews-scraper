import WebSocket from 'ws';

const fetchData = async () => {
  const response = await fetch('http://localhost:3000/api/v0/ping/scrape');
  const data = await response.json();
  console.log(data);
};

// fetchData();

const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
  console.log('Connected to WebSocket');
  ws.send(JSON.stringify({
    type: 'JOB_STATUS',
    jobId: 'job123'
  }));
};

ws.onmessage = (event) => {
  const data = typeof event.data === 'string' ? event.data : event.data.toString();
  const parsedData = JSON.parse(data);
  console.log(parsedData);
};