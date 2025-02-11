# Grenache framework test
A dockerized playground for the Grenache framework
> There's an issue reachng out the workers running on different hosts than the grapes.

## Run the stack
```shell
# run this once or any time Dockerfile is updated
$ docker buildx build -t grape:23-alpine .

# run the services
$ docker compose up -d
$ docker ps
CONTAINER ID   IMAGE             COMMAND                  CREATED         STATUS         PORTS     NAMES
7a644d0e3267   9254829f4812      "grape --dp 20001 --…"   9 minutes ago   Up 9 minutes             grape-01
43f30662bf72   9254829f4812      "grape --dp 20001 --…"   9 minutes ago   Up 9 minutes             grape-02
6e3265589802   9254829f4812      "node /root/app/serv…"   9 minutes ago   Up 9 minutes             fibonacci-worker-01
```

## Run a client container
```shell
# identify the network out stack is using
$ docker network ls | grep grape-network
e1ad7873a906   microservices-test_grape-network   bridge    local

# create a folder to persist grenache-cli settings
$ mkdir -p root

# run a container, make sure to use the network we identified above
$ docker run --rm -it \
--name client \
-v .:/app \
-v ./root:/root \
--network microservices-test_grape-network \
--entrypoint bash \
grape:23-alpine
```
## Once in the container
```bash
# initialize grenache-cli, if needed. do this just once as we persist the settings
$ grenache-keygen
grenache-keygen: keypair generated successfully.

# check the files were generated
$ ls -la ~/.grenache-cli/
total 12
drwx------ 5 root root 160 Feb 11 15:04 .
drwxr-xr-x 4 root root 128 Feb 11 15:04 ..
-rw------- 1 root root 281 Feb 11 15:04 grenache-cli.conf
-rw------- 1 root root 128 Feb 11 15:04 key
-rw------- 1 root root  64 Feb 11 15:04 key.pub
```

## Trigger the issue
```shell
# run the client
$ cd /app
$ node client.js
node:events:485
      throw er; // Unhandled 'error' event
      ^

Error: connect ECONNREFUSED 172.18.0.4:1227
    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1634:16)
Emitted 'error' event on WebSocket instance at:
    at emitErrorAndClose (/app/node_modules/ws/lib/websocket.js:897:13)
    at ClientRequest.<anonymous> (/app/node_modules/ws/lib/websocket.js:752:5)
    at ClientRequest.emit (node:events:507:28)
    at emitErrorEvent (node:_http_client:104:11)
    at Socket.socketErrorListener (node:_http_client:518:5)
    at Socket.emit (node:events:507:28)
    at emitErrorNT (node:internal/streams/destroy:170:8)
    at emitErrorCloseNT (node:internal/streams/destroy:129:3)
    at process.processTicksAndRejections (node:internal/process/task_queues:90:21) {
  errno: -111,
  code: 'ECONNREFUSED',
  syscall: 'connect',
  address: '172.18.0.4',
  port: 1227
}

Node.js v23.7.0
```

The issue is that in this example `172.18.0.4` is the address for `grape-01`, not for `fibonacci-worker-01` which is `172.18.0.3`
```shell
$ docker container inspect grape-01 | jq -r '.[0].NetworkSettings.Networks'
{
  "microservices-test_grape-network": {
    "IPAMConfig": null,
    "Links": null,
    "Aliases": [
      "grape-01",
      "grape-01"
    ],
    "MacAddress": "02:42:ac:12:00:04",
    "DriverOpts": null,
    "NetworkID": "52ee044cdb723292dc647d87621312e3bbf2870e1cdb615f8c5d8c3ca08b991c",
    "EndpointID": "d144d40ca53ae21c0fade40854e382b32bd8c6c95e898521fb94b328a687e9f1",
    "Gateway": "172.18.0.1",
    "IPAddress": "172.18.0.4",
    "IPPrefixLen": 16,
    "IPv6Gateway": "",
    "GlobalIPv6Address": "",
    "GlobalIPv6PrefixLen": 0,
    "DNSNames": [
      "grape-01",
      "59ffbca4d916"
    ]
  }
}

$ docker container inspect fibonacci-worker-01 | jq -r '.[0].NetworkSettings.Networks'
{
  "microservices-test_grape-network": {
    "IPAMConfig": null,
    "Links": null,
    "Aliases": [
      "fibonacci-worker-01",
      "fibonacci-worker-01"
    ],
    "MacAddress": "02:42:ac:12:00:03",
    "DriverOpts": null,
    "NetworkID": "52ee044cdb723292dc647d87621312e3bbf2870e1cdb615f8c5d8c3ca08b991c",
    "EndpointID": "b2f0949ebc8bcd101e2f5b98f9bf016638cb206d46bd8f74615404197739cb77",
    "Gateway": "172.18.0.1",
    "IPAddress": "172.18.0.3",
    "IPPrefixLen": 16,
    "IPv6Gateway": "",
    "GlobalIPv6Address": "",
    "GlobalIPv6PrefixLen": 0,
    "DNSNames": [
      "fibonacci-worker-01",
      "96c176a7ab83"
    ]
  }
}
```

## Direct test
```shell
# check the port announced by the worker
$ grenache-lookup -g grape-01 -p 30001 fibonacci_worker
172.18.0.4:1227
           ˆˆˆˆ
```

Update `direct.js` to match the port exposed by server running at the `fibonacci-worker-01` container on your local
```js
const port = 1227;
```
run the script
```shell
$ node direct.js
Connected to server
Fibonacci number at place 10 in the sequence: 89
Connection closed
```
We are accessing the websocket using the worker hostname, docker resolves it to `172.18.0.3`

