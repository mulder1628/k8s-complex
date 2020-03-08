const keys = require('./keys');
const redis = require('redis');

const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000 // reconnect every 1s if ever loses connection
});

// duplicate of client - why? according redis (js lib) - if a client is listening/publishing
// we need dup, if connection is turned into subscribe or listen, it can't be
// use for other purposes
const sub = redisClient.duplicate();

// we use recursive to make it slow so warrants a separate
// worker process
function fib(index) {
    if (index < 2) return 1;
    return fib(index -1) + fib(index - 2);
}

// messsage contains the new index
// hset - hash set of values. key will be index (message) and value = the calculated fib sequence
sub.on('message', (channel, message) => {
    redisClient.hset('values', message, fib(parseInt(message)));
});

// subscribe to insert event
sub.subscribe('insert');
