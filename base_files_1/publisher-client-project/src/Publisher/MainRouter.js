import React from "react";
import {
    Switch,
    Route, Redirect
} from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import Dashboard from "./Pages/Dashboard/Dashboard";
import Login from "./Pages/Login";
import Server from "./Server";
import config from '../Config/config.json';

export default class MainRouter extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
        };

        Server.setRouter(this);
        
        this.basename = config.BaseName;
    }

    redirect = (redirectPath, redirectProps) => {
        this.redirectPath = redirectPath;
        this.setState({reload: true, redirectProps});
    };

    render () {
        if (this.redirectPath) {
            let redirectPath = this.redirectPath;
            delete this.redirectPath;
            return <Redirect to={{
                    pathname: redirectPath,
                    state: { from: this.props.location.pathname }
                }}
            />
        }

        return (
                <Switch>
                    <Route path="/login" basename={this.basename}>
                        <Login router={this} {...this.state.redirectProps}/>
                    </Route>

                    <PrivateRoute path="/dashboard" basename={this.basename}>
                        <Dashboard router={this} {...this.state.redirectProps}/>
                    </PrivateRoute>

                    <PrivateRoute path="/" basename={this.basename}>
                        <Redirect
                            to={{
                                pathname: "/dashboard",
                                state: { from: "/" }
                            }}
                        />
                    </PrivateRoute>
                </Switch>
        )
    }
}
