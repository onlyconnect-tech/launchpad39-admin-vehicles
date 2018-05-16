const Promise = require('bluebird');

const DBPool = require('./../lib/db');
const configDb = require('./../service/config_db');

const moment = require('moment');

const pool = new DBPool(configDb);

class Sessions {

    insertSession(uuid, ownersCode) {

        return new Promise(function(resolve, reject) { 

            //ask for a client from the pool
            pool.connect(function(err, client, done) {

                if(err) {
                    console.error('error fetching client from pool', err);
                    return reject(err);
                }
                
                //use the client for executing the query
                
                client.query('INSERT INTO sessions (id_client, owners_code, date_log) values ($1, $2, now())',
                    [ uuid, ownersCode ], function(err) {
                //call `done(err)` to release the client back to the pool (or destroy it if there is an error)

                done(err);

                if(err) {
                    console.error('error running query', err);
                    return reject(err);
                }

                resolve();

                });
            });
        });
    }

    updateSessionOnLogout(uuid) {

        return new Promise(function(resolve, reject) { 

            //ask for a client from the pool
            pool.connect(function(err, client, done) {

                if(err) {
                    console.error('error fetching client from pool', err);
                    return reject(err);
                }
                
                //use the client for executing the query
                
                client.query('UPDATE sessions set date_lout = now() where id_client = $1',
                    [ uuid ], function(err) {
                //call `done(err)` to release the client back to the pool (or destroy it if there is an error)

                done(err);

                if(err) {
                    console.error('error running query', err);
                    return reject(err);
                }

                resolve();

                });
            });
        });
    }

    updateSession(uuid) {

        return new Promise(function(resolve, reject) { 

            //ask for a client from the pool
            pool.connect(function(err, client, done) {

                if(err) {
                    console.error('error fetching client from pool', err);
                    return reject(err);
                }
                
                //use the client for executing the query
                
                client.query('UPDATE sessions set date_upd = now() where id_client = $1',
                    [ uuid ], function(err) {
                //call `done(err)` to release the client back to the pool (or destroy it if there is an error)

                done(err);

                if(err) {
                    console.error('error running query', err);
                    return reject(err);
                }

                resolve();

                });
            });
        });
    }


}


module.exports = Sessions;