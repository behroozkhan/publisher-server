import axios from "axios";
import Auth from "./Auth";
import config from '../Config/config.json';

class ServerManager {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    getOptions = () => {
        return {
            headers: {
                'Authorization': Auth.getAuthorization(),
                'pport': config.pport
            }
        }
    };

    setRouter = (router) => {
        this.router = router;
    };

    getUserWebsites = (cb) => {
        axios.get(`${this.baseUrl}/website`, this.getOptions())
            .then(res => {
                if (res.data.success) {
                    cb(true, res.data.data);
                } else {
                    cb(false, undefined, res.data.message);
                }
            })
            .catch(error => {
                if (error.response && error.response.status === 401) {
                    this.router.redirect('/login');
                } else {
                    cb(false, undefined, error);
                }
            })
    };

    createNewWebSite = (website, cb) => {
        axios.post(`${this.baseUrl}/website`, website, this.getOptions())
            .then(res => {
                if (res.data.success) {
                    cb(true, res.data.data.website);
                } else {
                    cb(false, undefined, res.data.message);
                }
            })
            .catch(error => {
                if (error.response && error.response.status === 401) {
                    this.router.redirect('/login');
                } else {
                    cb(false, undefined, error);
                }
            })
    };
}

// let Server = new ServerManager("/whitelabel");
let Server = new ServerManager('/api');

export default Server;
