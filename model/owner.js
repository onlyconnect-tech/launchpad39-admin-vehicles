'use strict';

const Promise = require('bluebird');

const DBPool = require('./../lib/db');
const configDb = require('./../service/config_db');

const moment = require('moment');

const pool = new DBPool(configDb);

class Owner {

    getOwner(username) {

         return new Promise(function(resolve, reject) {

            pool.connect(function(err, client, done) {

                if(err) {
                    console.error('error fetching client from pool', err);
                    return reject(err);
                }

                client.query('SELECT  owners_code, password from owners where owners_code = $1',
                    [username], function(err, result) {
                        //call `done(err)` to release the client back to the pool (or destroy it if there is an error)

                        done(err);

                        if(err) {
                            console.error('error running query', err);
                            return reject(err);
                        }
                        
                        if(result.rowCount === 0) {
                            return null;
                        }

                        var elem = result.rows[0];

                        resolve({ owner_code: elem.owners_code, password: elem.password });

                    });

            });

        });


    }

    getListOwners() {

        return new Promise(function(resolve, reject) {

           var listDroneInfo = [];

           pool.connect(function(err, client, done) {

               if(err) {
                   console.error('error fetching client from pool', err);
                   return reject(err);
               }

               client.query('SELECT  id::int, owners_code, owners_name, date_inst from owners order by id',
                   [], function(err, result) {
                       //call `done(err)` to release the client back to the pool (or destroy it if there is an error)

                       done(err);

                       if(err) {
                           console.error('error running query', err);
                           return reject(err);
                       }
                       
                       result.rows.forEach(function (elem) {
                           var dateInstFormatted = moment(elem.date_inst).format('YYYYMMDDHH:mm:ss');
                           console.log('dateInstFormatted:', dateInstFormatted);
                           var aElem = { id: elem.id, owner_code: elem.owners_code, owner_name: elem.owners_name, date_inst: dateInstFormatted };
                           
                           listDroneInfo.push(aElem);
                       });

                       resolve(listDroneInfo);

                   });

           });

       });


   }

   checkIfYetSomeOwnerCode(ownerCode){

       return new Promise(function(resolve, reject) { 

               //ask for a client from the pool
               pool.connect(function(err, client, done) {

                   if(err) {
                       console.error('error fetching client from pool', err);
                       return reject(err);
                   }
                   
                   //use the client for executing the query
                   
                   client.query('SELECT owners_code from owners where owners_code = $1',
                   [ ownerCode ], function(err, result) {
                   //call `done(err)` to release the client back to the pool (or destroy it if there is an error)

                   done(err);

                   if(err) {
                       console.error('error running query', err);
                       return reject(err);
                   }

                   resolve(result.rowCount === 1);

                   });
               });
       }); // end promise
   }

   addOwner(ownerCode, ownerName, ownerHashedPassword) {

       // check il no same ownerCode

       // if ok add owner

           return new Promise(function(resolve, reject) { 

               //ask for a client from the pool
               pool.connect(function(err, client, done) {

                   if(err) {
                       console.error('error fetching client from pool', err);
                       return reject(err);
                   }
                   
                   //use the client for executing the query
                   
                   client.query('INSERT INTO owners (owners_code, owners_name, password, date_inst) values ($1, $2, $3, now())',
                   [ ownerCode, ownerName, ownerHashedPassword ], function(err) {
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


module.exports = Owner;