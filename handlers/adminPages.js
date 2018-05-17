'use strict';

const Boom = require('boom');

const Promise = require('bluebird');
const DroneInfo = require('./../model/drone_info');
const Owner = require('./../model/owner');

const bcrypt = require('bcrypt-nodejs');

const droneInfo = new DroneInfo();
const owner = new Owner();

exports.home = function( request, reply) {
    reply.view('home');
};

exports.listVehicles = function (request, reply) {

    droneInfo.getListDroneInfo().then(function resolve(results) {
        reply.view('list_vehicles', {vehicles: results});
    }, function reject(err) {
        reply({err: err});
    });   
};

exports.addVehicleView = function (request, reply) {

    var ownerCode = request.params.ownerCode;

    Promise.all([owner.getListOwners(), droneInfo.getVehicleTypes()])
    .then(function(results){

        console.log(results);

        var listOwners = results[0];
        var idOwner = null;

        if (ownerCode) {

            function isBigEnough(value) {
                return value.owner_code === ownerCode;
            }

            var filtered = listOwners.filter(isBigEnough);

            if(filtered.length != 1) {
                // return error
                return reply({ err: 'NO CODE: ' + ownerCode });
            } else {
                idOwner = filtered[0].id;
            }
        }

        return reply.view('add_vehicle', { listOwners: listOwners, vehiclesTypes: results[1], 
            ownerCode: ownerCode, idOwner: idOwner });
    }, function(err) {
        return reply({ err: err });
    });

};

exports.doAddVehicle = function (request, reply) {
        var queueName = request.payload.queue_name;
        var droneType = request.payload.drone_type;
        var idOwner = request.payload.id_owner;

        console.log('OK queueName:', queueName, ', droneType:', droneType, ', idOwner:', idOwner);

        droneInfo.insertDroneInfo(queueName, droneType, idOwner).then(function resolve() {
            return reply.redirect('/admin/list_vehicles');
        }, function reject(err) {
            return reply({ err: err});
        });
        
    };

exports.doAddVehicleFail = function (request, reply, source, error) {

    const errors = {};
    const details = error.data.details;

    console.log(details);

    for (let i = 0; i < details.length; ++i) {
        if (!errors.hasOwnProperty(details[i].path)) {
            errors[details[i].path] = details[i].message;
        }
    }

    // check 
    console.log('***: ', request.payload.isFromOwner, request.payload.id_owner);

    Promise.all([owner.getListOwners(), droneInfo.getVehicleTypes()])
                    .then(function(results){

                        console.log(results);

                        var listOwners = results[0];

                        var ownerCode = request.payload.ownerCode;
                        var idOwner = null;

                        if (ownerCode) {

                            function isBigEnough(value) {
                                return value.owner_code === ownerCode;
                            }

                            var filtered = listOwners.filter(isBigEnough);

                            if(filtered.length != 1) {
                                // return error
                                return reply({ err: 'NO CODE: ' + ownerCode });
                            } else {
                                idOwner = filtered[0].id;
                            }
                        }

                        return reply.view('add_vehicle', { listOwners: listOwners, vehiclesTypes: results[1], 
                                errors: errors,
                                values: request.payload, ownerCode:  ownerCode, idOwner: idOwner });
                       
                    }, function(err) {
                        return reply({ err: err }).code(400);
                    });
};

exports.removeVehicle = function (request, reply) {
    var id = request.params.id;

    droneInfo.removeDroneInfo(id).then(function resolve() {
            return reply.redirect('/admin/list_vehicles');
        }, function reject(err) {
            return reply({ err: err});
        });
    
    
};

exports.changeStatusVehicle = function(request, reply) {
        var id = request.params.id;
        
        droneInfo.changeStatusVehicle(id).then(function resolve() {
            return reply.redirect('/admin/list_vehicles');
        }, function reject(err) {
            return reply({ err: err});
        });
    };

exports.addOwnerView = function (request, reply) {
        
        owner.getListOwners().then(function resolve(owners) {
            return reply.view('add_owner', { owners: owners });
        }, function reject(err) {
            return reply({ err: err });
        });
        
    };

exports.doAddOwner = function (request, reply) {
        var ownerCode = request.payload.owner_code;
        var ownerName = request.payload.owner_name;
        var password   = request.payload.password;

        owner.checkIfYetSomeOwnerCode(ownerCode).then( function resolve(ifYet){
            
            if(ifYet) {
                //
                // return reply(Boom.badRequest(ownerCode + ' yet used'));
                const errors = {};
                errors['owner_code'] = 'OWNER YET';

                owner.getListOwners().then(function resolve(owners) {
                    return reply.view('add_owner', {
                    errors: errors,
                    values: request.payload,
                    owners: owners
                }).code(400);
                }, function reject(err) {
                    return reply(new Error(err));
                });
            } 
            
            console.log(bcrypt);
            // var salt = bcrypt.genSaltSync(10);

            // same as the server
            var salt = '$2a$10$IbCAY0aE7VjKGL9WhF/ezu';

            bcrypt.hash(password, salt, null, function(err, hashPassword) {
                // Store hash in your password DB.

                if(err) {
                    console.log('Error on bcrypt.hash: ', err);
                    return reply(new Error(err));
                }

                owner.addOwner(ownerCode, ownerName, hashPassword).then( function resolve(){
                    return reply.redirect('/admin/add_owner');
                }, function reject(err) {
                    return reply(new Error(err));
                });
            });
            

        }, function error(err) {
            return reply(new Error(err));
        });

        
        
    };

exports.doAddOwnerFail = function (request, reply, source, error) {

                const errors = {};
                const details = error.data.details;

                console.log(details);

                for (let i = 0; i < details.length; ++i) {
                    if (!errors.hasOwnProperty(details[i].path)) {
                        errors[details[i].path] = details[i].message;
                    }
                }

                owner.getListOwners().then(function resolve(owners) {
                    return reply.view('add_owner', {
                    errors: errors,
                    values: request.payload,
                    owners: owners
                }).code(400);
            
        }, function reject(err) {
            console.error('owner.getListOwners():', err);
            return reply(new Error(err));
        });

};

exports.adminOwnersView = function (request, reply) {
    
    owner.getListOwners().then(function resolve(owners) {
        var listOwnerCodes = owners.map(function(elem) {
            return elem.owner_code;
        });

        droneInfo.getListDroneInfo().then(function resolve(results) {

        // { id: elem.id, queue_name: elem.queue_name, drone_type: elem.drone_type, owners_code: elem.owners_code, owners_name: elem.owners_name, is_active: elem.is_active }
        var mapOwnersVehicles = new Map();
        results.forEach(function(element) {

            var mapElem = mapOwnersVehicles.get(element.owners_code);
            
            if(!mapElem) {
                let table = [];

                table.push(element);
                mapOwnersVehicles.set(element.owners_code, table);
            } else {
                mapElem.push(element);
            }
        }, this);

            var composedListOwnerCodes = [];

            composedListOwnerCodes = listOwnerCodes.map(function(elem) {
                var values = [];
                if(mapOwnersVehicles.has(elem)) {
                    values = mapOwnersVehicles.get(elem);  
                }
                return { key: elem, values: values};
            });

            reply.view('admin_owners', { composedListOwnerCodes: composedListOwnerCodes, 
                mapOwnersVehicles: mapOwnersVehicles });
        }, function reject(err) {
            console.error('droneInfo.getListDroneInfo():', err);
            reply(new Error(err));
        });   
    


    }, function reject(err) {
        console.error('owner.getListOwners():', err);
        return reply(new Error(err));
    });

};
