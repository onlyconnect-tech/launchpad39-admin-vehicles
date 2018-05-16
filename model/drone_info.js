'use strict';

const Promise = require('bluebird');

const DBPool = require('./../lib/db');
const configDb = require('./../service/config_db');

const pool = new DBPool(configDb);

class DroneInfo {

    getListDroneInfo(){

        return new Promise(function(resolve, reject) {

            var listDroneInfo = [];

            pool.connect(function(err, client, done) {

                if(err) {
                    console.error('error fetching client from pool', err);
                    return reject(err);
                }

                client.query('SELECT  A.id::int, A.queue_name, A.drone_type, A.is_active::boolean, B.owners_code, B.owners_name from drone_info A, owners B where A.id_owner = B.id order by A.id',
                    [], function(err, result) {
                        //call `done(err)` to release the client back to the pool (or destroy it if there is an error)

                        done(err);

                        if(err) {
                            console.error('error running query', err);
                            return reject(err);
                        }
                        
                        result.rows.forEach(function (elem) {
                            var aElem = { id: elem.id, queue_name: elem.queue_name, drone_type: elem.drone_type, owners_code: elem.owners_code, owners_name: elem.owners_name, is_active: elem.is_active };
                            
                            listDroneInfo.push(aElem);
                        });

                        resolve(listDroneInfo);

                    });

            });

        });

    }

    insertDroneStatus(queueName, lat, lon, alt, groundspeed, yaw, roll, pitch ) {

        return new Promise(function(resolve, reject) { 

            //ask for a client from the pool
            pool.connect(function(err, client, done) {

                if(err) {
                    console.error('error fetching client from pool', err);
                    return reject(err);
                }
                
                //use the client for executing the query
                
                client.query('INSERT INTO drone_status (time, id_queue, lat, lon, alt, groundspeed, yaw, roll, pitch) select now(), B.id, $2, $3, $4, $5, $6, $7, $8 from DRONE_INFO B where B.queue_name = $1',
                [ queueName, lat, lon, alt, groundspeed, yaw, roll, pitch ], function(err) {
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


    getDroneHistoryStatus(queueName) {
        
        return new Promise(

            function(resolve, reject) {

                pool.connect(function(err, client, done) {

                    if(err) {
                        console.error('error fetching client from pool', err);
                        return reject(err);
                    }
            
                    //use the client for executing the query
                    // lat, lon, alt, groundspeed, yaw, roll, pitch
                    client.query('SELECT  A.time, A.lat::float, A.lon::float, A.alt::float, A.groundspeed::float, A.yaw::float, A.roll::float, A.pitch::float from drone_status A, drone_info B where A.id_queue = B.id and B.queue_name = $1 order by time asc',
                    [ queueName ], function(err, result) {  
                        //call `done(err)` to release the client back to the pool (or destroy it if there is an error)

                        done(err);

                        if(err) {
                            console.error('error running query', err);
                            return reject(err);
                        }
                        
                        var arr = [];

                        var arrElemPrevoius = null;

                        result.rows.forEach(function (elem) {
                            var aElem = [];
                            aElem.push(elem.time);
                            aElem.push(elem.lat);
                            aElem.push(elem.lon);

                            if(arrElemPrevoius) {
                                // chek if changed, else continue

                                if(arrElemPrevoius[1] === aElem[1] && arrElemPrevoius[2] === aElem[2]) {
                                    return;
                                }
                            }

                            arrElemPrevoius = aElem;
                            
                            arr.push(aElem);
                        });

                        var lastRecord = result.rows.pop();

                        var valueLastRecord = {};

                        if(lastRecord) {
                            valueLastRecord.time = lastRecord.time;
                            valueLastRecord.lat = lastRecord.lat;
                            valueLastRecord.lon = lastRecord.lon;
                            valueLastRecord.alt = lastRecord.alt;
                            valueLastRecord.groundspeed = lastRecord.groundspeed;
                            valueLastRecord.yaw = lastRecord.yaw;
                            valueLastRecord.roll = lastRecord.roll;
                            valueLastRecord.pitch = lastRecord.pitch;
                        }

                        //output: 1

                        var response = { values: arr, lastRecord: valueLastRecord };
                        resolve(response);

                    });
                });

            }
        );
        



    }


    getVehicleTypes() {

       return new Promise(function(resolve, reject) {

            var listVehicleTypes = [];

            pool.connect(function(err, client, done) {

                if(err) {
                    console.error('error fetching client from pool', err);
                    return reject(err);
                }

                client.query('SELECT unnest(enum_range(NULL::vehicle))::text AS vehicle_type',
                    [], function(err, result) {
                        //call `done(err)` to release the client back to the pool (or destroy it if there is an error)

                        done(err);

                        if(err) {
                            console.error('error running query', err);
                            return reject(err);
                        }
                        
                        result.rows.forEach(function (elem) {
                            listVehicleTypes.push(elem.vehicle_type);
                        });

                        resolve(listVehicleTypes);

                    });

            });

        });

    }


    insertDroneInfo(queueName, droneType, idOwner) {

        return new Promise(function(resolve, reject) { 

            //ask for a client from the pool
            pool.connect(function(err, client, done) {

                if(err) {
                    console.error('error fetching client from pool', err);
                    return reject(err);
                }
                
                //use the client for executing the query
                
                client.query('INSERT INTO drone_info (queue_name, drone_type, id_owner, date_inst) values ($1, $2, $3, now())',
                [ queueName, droneType, idOwner ], function(err) {
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

   rollback(client, done) {
        client.query('ROLLBACK', done);
    }

   removeDroneInfo(idDroneInfo) {
        var self = this;
        return new Promise(function(resolve, reject) { 

             pool.connect((err, client, done) => {
                if (err) {
                    throw err;
                }
                client.query('BEGIN', (err, result) => {
                    if (err) {
                        console.error(err);
                        self.rollback(client, done);
                        return reject(err);
                    }
                    client.query('delete from drone_status where id_queue = $1', [ idDroneInfo ], (err, result) => {
                        if (result.rowCount > 0) {
                            console.log('line items from order', idDroneInfo, 'deleted.');
                        }
                        if (err) {
                            self.rollback(client, done);
                            return reject(err);
                        }
                        client.query('DELETE FROM drone_info where id = $1', [ idDroneInfo ], (err, result) => {
                            if (err) {
                                console.error(err);
                                self.rollback(client, done);
                                return reject(err);
                            }
                            if (result.rowCount === 0) {
                                console.log('No order with id', idDroneInfo);
                                self.rollback(client, done);
                                return reject(err);
                            }

                            client.query('COMMIT', function() {
                                done(); 
                                return  resolve(); 
                            });
                        });
                    });
                });
            });

        });

   }

   changeStatusVehicle(idDroneInfo) {
        var self = this;
        return new Promise(function(resolve, reject) { 

             pool.connect((err, client, done) => {
                if (err) {
                    throw err;
                }
                client.query('BEGIN', (err, result) => {
                    if (err) {
                        console.error(err);
                        self.rollback(client, done);
                        return reject(err);
                    }
                    client.query('select is_active from drone_info where id = $1', [ idDroneInfo ], (err, result) => {
                        
                        if (err) {
                            self.rollback(client, done);
                            return reject(err);
                        }

                        if (result.rowCount === 0) {
                            console.log('no item', idDroneInfo);
                            return resolve();
                        }

                        var isActive = result.rows[0].is_active;

                        client.query('UPDATE drone_info set is_active = $2 where id = $1', [ idDroneInfo, !isActive], (err, result) => {
                            if (err) {
                                console.error(err);
                                self.rollback(client);
                                return reject(err);
                            }
                            if (result.rowCount === 0) {
                                console.log('No order with id', idDroneInfo);
                                self.rollback(client, done);
                                return reject(err);
                            }

                            client.query('COMMIT', function() {
                                done(); 
                                return  resolve(); 
                            });
                           
                        });
                    });
                });
            });

        });

   }


}


module.exports = DroneInfo;



