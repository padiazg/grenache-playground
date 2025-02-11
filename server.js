'use strict'
const { PeerRPCServer }  = require('grenache-nodejs-ws');
const Link = require('grenache-nodejs-link');
const _ = require('lodash');

function fibonacci (n) {
  if (n <= 1) {
    return 1
  }
  return fibonacci(n - 1) + fibonacci(n - 2)
}

const link = new Link({
  grape: 'http://grape-01:30001'
})
link.start()

const peer = new PeerRPCServer(link, {})
peer.init()

const service = peer.transport('server')
service.listen(_.random(1000) + 1024)

link.announce('fibonacci_worker', service.port, {})
setInterval(() => {
  link.announce('fibonacci_worker', service.port, {})
}, 100000)

service.on('request', (rid, key, payload, handler) => {
  console.log(`request: ${payload}`);
  const result = fibonacci(payload.number);
  handler.reply(null, result);
})