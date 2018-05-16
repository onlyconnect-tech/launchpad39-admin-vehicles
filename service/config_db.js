'use strict';

const env = require('env2')('./.env');

const config = {
  user: process.env.DB_USER , //env var: PGUSER
  database: process.env.DB_NAME , //env var: PGDATABASE
  password: process.env.DB_PASS , //env var: PGPASSWORD
  host: process.env.DB_HOST , // Server hosting the postgres database
  port: process.env.DB_PORT, //env var: PGPORT
  max: 10, // max number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
};

module.exports = config;

