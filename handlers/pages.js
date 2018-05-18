'use strict';

const Promise = require('bluebird');
const bcrypt = require('bcrypt-nodejs');

const Owners = require('../model/owner');
const Sessions = require('../model/sessions');

const RedisService = require('../service/redis_service'); 

const uuidV1 = require('uuid/v1');

const ownerDAO = new Owners();
const sessions = new Sessions();

exports.checkLogin = function(request, h) {

    // username and password
    // check authentication 

    var username = request.payload.username;
    var password = request.payload.password;

    console.log('username:', username);
    console.log('password:', password);

    return ownerDAO.getOwner(username).then(function resolve(owner) {
        if(!owner) {
            console.log('NOT FOUND USER WITH username:', username);
            // try Boom
            return { statusCode: '400', validation: 'FAILURE' };
        }
        
        return new Promise(function(resolve, reject) {

            bcrypt.compare(password, owner.password, function(err, res) {

            if(err) {
                console.error('', err);
                reject({ statusCode: '400', validation: 'FAILURE' });
            }

            if(res) {
                console.log('OK VALIDATION PASSWORD!!!');
                var uuid = uuidV1();

                // RedisService.putInSession(uuid, owner.owner_code);
                // sessions.insertSession(uuid, owner.owner_code);
                console.log("SONO QUI");
                var obj = { statusCode: '200', validation: 'OK', clientID: uuid, customerID: owner.owner_code };
                return resolve(obj);
            }

            console.warn('NO VALIDATION PASSWORD');
            return resolve({ statusCode: '400', validation: 'FAILURE' });
        
        });

       });
               
       /*
       var uuid = uuidV1();
       return { statusCode: '200', validation: 'OK', clientID: uuid, customerID: "demo" };
        */
        
    }, function reject(err) {
        console.error('ERROR:', err);
        return { statusCode: '400', validation: 'FAILURE' };
    });
    
};

exports.handleLogout = function (request, reply) {

    console.log('LOGOUT REQUEST:', request.params.id);

    RedisService.deleteSession(request.params.id);

    // update session.setLogout
    sessions.updateSessionOnLogout(request.params.id);

    return { status: 'OK'};

    
};

exports.handleUpdateSession = function (request, reply) {

    console.log('UPDATE SESSION REQUEST:', request.params.id);

    RedisService.updateSession(request.params.id);

    // update session.setLogout
    sessions.updateSession(request.params.id);

    return { status: 'OK'};

    
};
