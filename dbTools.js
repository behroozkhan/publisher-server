const { Pool } = require('pg');
const pgtools = require('pgtools');

module.exports.initDB = (dbName, config, callback) => {
    const pool = new Pool({...config});

    pool.query(`SELECT FROM pg_database WHERE datname = '${dbName}'`, (err, res) => {
        pool.end();
        if (res.rows.length > 0) {
            callback(true);
        } else {
            pgtools.createdb(config, dbName, function(err, res) {
                if (err) {
                    callback(false, error);
                    return;
                }
                callback(true);
            });
        }
    });
}