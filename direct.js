const WebSocket = require('ws');
const uuid = require('uuid').v4;
const program = require('yargs')
  .option('h', {
    describe: 'Worker hostname',
    alias: 'host',
    type: 'string',
    demand: true
  })
  .option('p', {
    describe: 'Port',
    alias: 'port',
    type: 'number',
    demand: true
  })
  .option('d', {
    describe: 'Data',
    alias: 'data',
    type: 'string',
    demand: true
  })
  .help('help')
  .version()
  .example('direct --h fibonacci-worker-01 --p 1227 --d \'{"number": 10}\'')
  .example('direct --host fibonacci-worker-01 --port 1227 --data \'{"number": 10}\'')
  .usage('Usage: $0 --h <worker-host> --p <port> --d <data>')
  .argv


const waitForConnection = ws => new Promise((resolve, reject) => {
  let currentAttemp = 0;
  const interval = setInterval(() => {
    if (currentAttemp > 9 ) {
      clearInterval(interval);
      reject(new Error(`Can't connect after ${currentAttemp} attempts`));
    } else if (ws.readyState == ws.OPEN) {
      clearInterval(interval);
      resolve()
    }
    currentAttemp++;
  }, 200);
});

const listen = (host, port) => {
  const ws = new WebSocket(`ws://${host}:${port}/ws`);
  ws.on('open', () => { console.log('Connected to server'); });
  ws.on('error', err => { console.error('WebSocket error:', err); });
  ws.on('close', () => { console.log('Connection closed'); });

  ws.onmessage = message => {
    const res = JSON.parse(message.data);
    console.log(`res: ${res}`)
    ws.close();
  };

  return ws
}

const parseData = rawData => {
  try {
    const data = JSON.parse(rawData)
    if (data) {
      return data
    } else {
      throw new Error('Error: Invalid data format. Data must be a valid JSON object')
    }
  } catch (err){
    throw new Error('Error: Failed to parse data. Ensure data is valid JSON:', err.message)
  }
}

const main = async () => {
  try {
    const data = parseData(program.d);
    const host = program.h;
    const port = program.p;
    const ws = listen(host, port);

    process.on('SIGINT', () => {
      ws.close();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      ws.close();
      process.exit(0);
    });

    await waitForConnection(ws);
    ws.send(JSON.stringify([uuid(), null, data]));
  
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

main();