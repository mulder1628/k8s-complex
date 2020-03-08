const keys = require('./keys');

// ********************//
// Express App Setup
// ********************//

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// receive & respond to react application
const app = express();
const port = 5000;

// cross origin resource sharing allows req 1 domain to diff domain (port) api hosted on
app.use(cors());
// turned body to json to work (ez) with 
app.use(bodyParser.json());

// ********************//
// Postgres Client Setup
// ********************//

const { Pool } = require('pg');
const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort
});
pgClient.on('error', () => {
    console.log('lost PG connection!');
});

// create a table to house the indexes = number (column name)
pgClient
    .query('CREATE TABLE IF NOT EXISTS values (number INT)')
    .catch(err => console.log(err));

// ********************//
// Redis Client Setup
// ********************//

const redis = require('redis');
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000 // reconnect every 1s if ever loses connection
});

// duplicate of client - why? according redis (js lib) - listening/publishing
// we need dup, if connection is turned into subscribe or listen, it can't be
// use for other purposes
const redisPubliser  = redisClient.duplicate();

// ********************//
// Express route handlers
// ********************//

app.get('/', (req, res) => {
    res.send('Hello World!');
});

// query a running postgres to return all indexes submitted
app.get('/values/all', async (req, res) => {
    const values = await pgClient.query('SELECT * from values');
    res.send(values.rows);
});

// reach into redis and return all the calculated and indexes
// redis js package doesn't support promise, thus no await syntax
// need to use traditional.
app.get('/values/current', async(req, res) => {
    redisClient.hgetall('values', (err, values) => {
        res.send(values);
    });
});

app.post('/values', async (req, res) => {
    // cap the upper limit of index (calc is expensive)
    const index = req.body.index;
    if (parseInt(index)> 40) {
        return res.status(422).send('Index too high!');
    }

    // a new index, set "not yet done" to redis value
    // tell subscriber new index just added
    redisClient.hset('values', index, 'Nothing yet!')
    redisClient.publish('insert', index);
 
    // permanently insert into this table
    pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);
    res.send({working: true});
});

app.listen(port, err => console.log(`listening on port: ${port}!`));
