import React from "react";
import {
    Switch,
    Route, Redirect
} from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import Dashboard from "./Pages/Dashboard/Dashboard";
import Login from "./Pages/Login";
import Server from "./Server";

export default class MainRouter extends React.Component {
    constructor(props) {
        super(props);

        this.state = {};

        Server.setRouter(this);
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
                    <Route path="/login">
                        <Login router={this} {...this.state.redirectProps}/>
                    </Route>

                    <PrivateRoute path="/dashboard">
                        <Dashboard router={this} {...this.state.redirectProps}/>
                    </PrivateRoute>

                    <PrivateRoute path="/">
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
