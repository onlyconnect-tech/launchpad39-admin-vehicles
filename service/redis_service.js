'use strict';

var redisClient = require('redis-connection')(); // require & connect

redisClient.on('connect'     , log('connect'));
redisClient.on('ready'       , log('ready'));
redisClient.on('reconnecting', log('reconnecting'));
redisClient.on('error'       , log('error'));
redisClient.on('end'         , log('end'));

function log(type) {
    return function() {
        console.log(type, arguments);
    };
}

const MIN_EXP = 5;

exports.putInSession = function (clientID, customerID) {
    console.log('insert into session - clientID:', clientID, '- customerID:', customerID);
    redisClient.set(clientID, customerID, 'EX', MIN_EXP * 60);
};

exports.updateSession = function (clientID) {
    console.log('updateSession - clientID:', clientID);
    // update if present TTL

    redisClient.get(clientID, function (err, value){
        if (err) {
            console.error('error updating clientID:', clientID, err);
            return;
        }
        redisClient.set(clientID, value, 'EX', MIN_EXP * 60);
    });

};

exports.deleteSession = function (clientID) {
    console.log('deleteSession - clientID:', clientID);
    
    // becco il customerID
    redisClient.get(clientID, function (err, customerID){
        if (err) {
            console.error('error getting clientID:', clientID, err);
            return;
        }
        
        if(customerID) {
            redisClient.del(clientID);
        } // otherwise not more in session - shouldn't happends
        
    });

    
};