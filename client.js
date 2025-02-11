'use strict'
const { PeerRPCClient }  = require('grenache-nodejs-ws')
const Link = require('grenache-nodejs-link')

const link = new Link({
  grape: 'http://grape-01:30001',
  requestTimeout: 10000
})
link.start()

const peer = new PeerRPCClient(link, {})
peer.init()

const payload = { number: 10 }
peer.request('fibonacci_worker', payload, { timeout: 100000 }, (err, result) => {
  if (err) {
    console.log(err)
  }
  
  console.log(
    'Fibonacci number at place',
    payload.number,
    'in the sequence:',
    result
  )
}) 