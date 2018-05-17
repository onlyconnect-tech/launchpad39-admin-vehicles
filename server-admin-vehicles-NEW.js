'use strict';

const Hapi = require('hapi');

const server = new Hapi.Server({ port: 3000, host: 'localhost' });

var options = { reporters: { myConsoleReporter: 
        [{
            module: 'good-squeeze',
            name: 'Squeeze',
            args: [{ log: '*', response: '*' }]
        }, {
            module: 'good-console'
        }, 'stdout'] }
    };

/*

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

*/

/*
server.register([ 
    require('inert'), 
    require('vision'), { 
        register: require('good'), 
        options 
    } 
]);
*/

const start = async () => {

    await server.register([require('inert'), require('vision')]);

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

    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});


start();


