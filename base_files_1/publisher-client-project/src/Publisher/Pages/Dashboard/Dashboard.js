import React from 'react';
import './Dashboard.css';
import Server from "../../Server";
import WebsiteItem from "./WebsiteItem";
import Button from "@material-ui/core/Button/Button";
import NewWebsiteModal from "./NewWebsiteModal";

export default class Dashboard extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            websites: [],
            loading: true
        };
    }

    componentDidMount(){
        this.mounted = true;
        this.load();
    }

    componentWillUnmount(){
        this.mounted = false;
    }

    load = () => {
        this.setState({loading: true, error: undefined});
        Server.getUserWebsites((success, websites, error) => {
            if (!this.mounted) return;

            if (success)
                this.setState({websites, loading: false});
            else
                this.setState({error, loading: false});
        });
    };

    onEditWebsite = (website) => (e) => {
        this.props.router.redirect("/editor", {website});
    };

    render () {
        return (
            <div className="DashboardPage">
                <div className="DashboardNewWebsiteBox">
                    <Button
                        className="DashboardNewWebsiteButton"
                        variant="contained" color="primary"
                        onClick={(e) => {this.setState({newWebsite: {}})}}
                    >
                        Enter
                    </Button>
                </div>
                <div className="DashboardWebsiteGrid">
                    {
                        this.state.websites.map(website => {
                            return (
                                <WebsiteItem
                                    key={website.name}
                                    website={website}
                                    onEditClick={this.onEditWebsite(website)}
                                />
                            )
                        })
                    }
                </div>

                {
                    this.state.newWebsite &&
                    <NewWebsiteModal
                        newWebsite={this.state.newWebsite}
                        onWebsiteCreated={() => {
                            this.setState({newWebsite: undefined});
                            this.load();
                        }}
                        onClose={() => {this.setState({newWebsite: undefined})}}
                    />
                }
            </div>
        )
    }
}
