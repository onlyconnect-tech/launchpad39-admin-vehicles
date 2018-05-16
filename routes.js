'use strict';

const AdminPages = require('./handlers/adminPages');
const Pages = require('./handlers/pages');
const Assets = require('./handlers/assets');

const Joi = require('joi');

const schemaLogin = {
    username: Joi.string().required(),
    password: Joi.string().required()
};

module.exports = [{
    method: 'GET',
    path: '/admin',
    handler: AdminPages.home
}, {
    method: 'GET',
    path: '/admin/list_vehicles',
    handler: AdminPages.listVehicles
}, {
    method: 'GET',
    path: '/admin/add_vehicle/{ownerCode?}',
    handler: AdminPages.addVehicleView
}, {
    method: 'POST',
    path: '/admin/add_vehicle',
    config: {
        payload: {
            output: 'data'
        },
        validate: {
            payload: {
                queue_name: Joi.string().required(),
                drone_type: Joi.string().required().disallow('-1'),
                id_owner: Joi.number().integer().disallow(-1),

                // for error page -in fail
                ownerCode: Joi.string(),
                isFromOwner: Joi.boolean()
            },
            options: {
                abortEarly: false
            },
            failAction: AdminPages.doAddVehicleFail //
        }
    },
    handler: AdminPages.doAddVehicle
}, {
    method: 'GET',
    path: '/admin/remove_vehicle/{id}',
    handler: AdminPages.removeVehicle,
    config: {
        validate: {
            params: {
                id: Joi.number().integer().min(1)
            }
        }
    }    
}, { 
    method: 'GET',
    path: '/admin/change_status_vehicle/{id}',
    handler: AdminPages.changeStatusVehicle,
    config: {
        validate: {
            params: {
                id: Joi.number().integer().min(1)
            }
        }
    }
}, {
    method: 'GET',
    path: '/admin/add_owner',
    handler: AdminPages.addOwnerView
},  {
    method: 'POST',
    path: '/admin/add_owner',
    handler: AdminPages.doAddOwner,
    config: {
        payload: {
            output: 'data'
        },
        validate: {
            payload: {
                owner_code: Joi.string().required().min(3).regex(/^[a-zA-Z0-9_.-]*$/),
                owner_name: Joi.string().required(),
                password: Joi.string().required().min(3).max(10),
                password_confirm: Joi.any().valid(Joi.ref('password'))
            },
            options: {
                abortEarly: false
            },
            failAction: AdminPages.doAddOwnerFail
        }
    }
}, {
    method: 'GET',
    path: '/admin/admin_owners',
    handler: AdminPages.adminOwnersView
}, {
    method: 'POST',
    path: '/admin/admin_owners',
    handler: function (request, reply) {

        return reply({ message: 'TODO'});
    }
}, {
    method: 'GET',
    path: '/admin/{param*}',
    handler: Assets.servePublicAdminDirectory
}, {
    config: {
        cors: true,
        payload: {
            output: 'data'
        },
        validate: {
            payload: schemaLogin
        }
    },
    method: 'POST',
    path:'/do_authentication', 
    handler: Pages.checkLogin
    }, {
        config: {
            cors: true,
            validate: {
                params: {
                    id: [Joi.string(), Joi.number()]
                }
            }
        },
        method: 'GET',
        path: '/do_logout/{id}',
        handler: Pages.handleLogout

        }, {
            config: {
                cors: true,
                validate: {
                    params: {
                        id: [Joi.string(), Joi.number()]
                    }
                }
            },
            method: 'GET',
            path: '/do_update_session/{id}',
            handler: Pages.handleUpdateSession
    
            }, {
            method: 'GET',
            path: '/{param*}',
            handler: Assets.servePublicDirectory
}];