'use strict';

const pg = require('pg')

class DBPool {

    constructor(config) {
      
      this.pool = new pg.Pool(config);

      this.pool.on('error', function (err, client) {
        // if an error is encountered by a client while it sits idle in the pool
        // the pool itself will emit an error event with both the error and
        // the client which emitted the original error
        // this is a rare occurrence but can happen if there is a network partition
        // between your application and the database, the database restarts, etc.
        // and so you might want to handle it and at least log it out
        console.error('idle client error', err.message, err.stack)
      });
    }

    //export the query method for passing queries to the pool
    query(text, values, callback) {
      console.log('query:', text, values);
      return this.pool.query(text, values, callback);
    }

    // the pool also supports checking out a client for
    // multiple operations, such as a transaction
    connect(callback) {
      return this.pool.connect(callback);
    }

}

module.exports = DBPool;