const WebSocket = require('ws');
const uuid = require('uuid').v4;

const port = 1227;
const rid = uuid();
const key = null;
const data = {number: 10};
const payload = [rid, key, data]
const ws = new WebSocket(`ws://fibonacci-worker-01:${port}/ws`);

ws.on('open', () => {
  console.log('Connected to server');
  ws.send(JSON.stringify(payload));
});

ws.on('error', (err) => {
  console.error('WebSocket error:', err);
});

ws.on('close', () => {
  console.log('Connection closed');
});

ws.on('connection', () => {
  console.log('Connected');
});

ws.onmessage = e => {
  const res = JSON.parse(e.data);
  console.log(
    'Fibonacci number at place',
    data.number,
    'in the sequence:',
    res[2]
  )
  ws.close();
};
