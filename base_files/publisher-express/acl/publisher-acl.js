import models, { sequelize } from './models';

let Acl       = require('acl');
let AclSeq    = require('acl-sequelize');

let acl = new Acl(new AclSeq(sequelize, { prefix: 'acl_' }));

acl.addRoleParents('weblancer', 'admin', 'user');

acl.allow([
    {
        roles: ['user'],
        allows: [
            {
                resources: ['/plan'],
                permissions: ['get'],
            },
            {
                resources: ['/user'],
                permissions: ['post', 'put'],
            },
            {
                resources: ['/app','/component','/service','/website'],
                permissions: ['get', 'post', 'put', 'delete'],
            },
        ],
    },
    {
        roles: ['admin'],
        allows: [
            {
                resources: ['/plan', '/user'],
                permissions: ['get', 'post', 'put', 'delete'],
            },
            {
                resources: ['/app','/component','/service','/website'],
                permissions: ['get', 'post', 'put', 'delete'],
            },
        ],
    },
    {
        roles: ['weblancer'],
        allows: [
            {
                resources: ['/plan', '/user','/app','/component','/service','/website'],
                permissions: ['get', 'post', 'put', 'delete'],
            }
        ],
    },
]);

export function checkPermissions(req, res, next) {
    if (req.user) {
        acl.isAllowed(
            req.user.id,
            req.url, req.method.toLowerCase(), (error, allowed) => {
                if (allowed) {
                    console.log('Authorization passed');
                    next();
                } else {
                    console.log('Authorization failed')
                    res.send({ message: 'Insufficient permissions to access resource' })
                }
            }
        );
    } else {
        res.send({ message: 'User not authenticated' })
    }
}

export default acl;