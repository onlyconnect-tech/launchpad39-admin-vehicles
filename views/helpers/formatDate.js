'use strict';

const Handlebars = require('handlebars');
const moment = require('moment');

module.exports = function ( dateValue, block ) {
   var newVal = moment(dateValue, 'YYYYMMDDHH:mm:ss').format('DD-MM-YYYY HH:mm:ss');
   return newVal;
};