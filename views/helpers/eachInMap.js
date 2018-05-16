'use strict';

const Handlebars = require('handlebars');

module.exports = function ( map, block ) {

   var out = '';

   for (var [keyV, valueV] of map) {
     out += block.fn( {key: keyV, value: valueV} );
   }
   
   return out;
};
