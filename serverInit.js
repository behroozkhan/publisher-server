const fsPromises = require('fs').promises;
let exec = require('child_process').exec;
let execP = Promise.promisify(exec);

module.exports.initServerNginxConfig = async (domain) => {
    let publisherNginxConfPath = __dirname + process.env.SOURCE_PUBLISHER_NGINX_CONF;
    let nginxSitesPath = process.env.NGINX_SITES_PATH;

    try {
        let data = await fsPromises.readFile(publisherNginxConfPath, 'utf8');
        data = data
            .replace(/{domain}/g, domain);
    
        nginxSitesPath = `${nginxSitesPath}/${domain}.conf`;
    
        fsPromises.writeFile(nginxSitesPath, data, 'utf8');
            
        command = `echo ${sudoPassword} | sudo -S nginx reload`;
    
        let nginxResult = await execP(command);
        
        if (nginxResult.status !== 0) {
            throw new Error ('Nginx error !!!');
        }

        return {
            success: true
        };
    } catch (error) {
        return {
            success: false,
            error: error
        };
    }
};