'use strict';

const Handlebars = require('handlebars');

module.exports = function ( key, map, block ) {

   var out = '';
   var value = null;
   
   console.log(key);
   console.log(map);

   if(map) {
        value = map.get(key);
   } 
     
   if(value) {
         console.log(value);
         out += block.fn( value );
   } else {
        out += block.fn( {} );
   }
        
   return out;
};