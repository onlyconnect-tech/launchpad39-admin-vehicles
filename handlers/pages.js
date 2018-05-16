'use strict';

const bcrypt = require('bcrypt-nodejs');

const Owners = require('../model/owner');
const Sessions = require('../model/sessions');

const RedisService = require('../service/redis_service'); 

const uuidV1 = require('uuid/v1');

const ownerDAO = new Owners();
const sessions = new Sessions();

exports.checkLogin = function(request, reply) {

    // username and password
    // check authentication 

    var username = request.payload.username;
    var password = request.payload.password;

    console.log('username:', username);
    console.log('password:', password);

    ownerDAO.getOwner(username).then(function resolve(owner) {
        if(!owner) {
            console.log('NOT FOUND USER WITH username:', username);
            // try Boom
            return reply({ statusCode: '400', validation: 'FAILURE' });
        }

        bcrypt.compare(password, owner.password, function(err, res) {

            if(err) {
                console.error('', err);
                return reply({ statusCode: '400', validation: 'FAILURE' });
            }

            if(res) {
                console.log('OK VALIDATION PASSWORD!!!');
                var uuid = uuidV1();

                RedisService.putInSession(uuid, owner.owner_code);
                sessions.insertSession(uuid, owner.owner_code);
                
                return reply({ statusCode: '200', validation: 'OK', clientID: uuid, customerID: owner.owner_code });
            }

            console.warn('NO VALIDATION PASSWORD');
            return reply({ statusCode: '400', validation: 'FAILURE' });
        
        });

        
        
    }, function reject(err) {
        console.error('ERROR:', err);
        return reply({ statusCode: '400', validation: 'FAILURE' });
    });
    
};

exports.handleLogout = function (request, reply) {

    console.log('LOGOUT REQUEST:', request.params.id);

    RedisService.deleteSession(request.params.id);

    // update session.setLogout
    sessions.updateSessionOnLogout(request.params.id);

    return reply({ status: 'OK'});

    
};

exports.handleUpdateSession = function (request, reply) {

    console.log('UPDATE SESSION REQUEST:', request.params.id);

    RedisService.updateSession(request.params.id);

    // update session.setLogout
    sessions.updateSession(request.params.id);

    return reply({ status: 'OK'});

    
};
