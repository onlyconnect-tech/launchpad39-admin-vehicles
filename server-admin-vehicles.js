'use strict';

const Hapi = require('hapi');

const server = new Hapi.Server();
server.connection({ port: 3000, host: 'localhost' });

var options = { reporters: { myConsoleReporter: 
        [{
            module: 'good-squeeze',
            name: 'Squeeze',
            args: [{ log: '*', response: '*' }]
        }, {
            module: 'good-console'
        }, 'stdout'] }
    };

server.ext('onPreResponse', (request, reply) => {

    if (request.response.isBoom) {
        const err = request.response;
        const errName = err.output.payload.error;
        const statusCode = err.output.payload.statusCode;

        return reply.view('error', {
            statusCode: statusCode,
            errName: errName
        }, { layout: false })
        .code(statusCode);
    }

    reply.continue();
});

server.register([ 
    require('inert'), 
    require('vision'), { 
        register: require('good'), 
        options 
    } 
], (err) => {

    if(err) {
        throw err;
    }

    server.views({
        engines: {
            hbs: require('handlebars')
        },
        relativeTo: __dirname,
        layoutPath: './views/layout',
        layout: true,
        partialsPath: './views/partials',
        helpersPath: './views/helpers',
        path: './views',
        isCached: false
    });

    server.route(require('./routes'));

    server.start((err) => {

        if (err) {
            throw err;
        }

        console.log(`Server running at: ${server.info.uri}`);
    });

});


