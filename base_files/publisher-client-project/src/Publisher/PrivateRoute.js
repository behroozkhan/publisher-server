import React from "react";
import Auth from "./Auth";
import {Redirect, Route} from "react-router-dom";

export default function PrivateRoute({ children, ...rest }) {
    return (
        <Route
            {...rest}
            render={({ location }) =>
                {
                    console.log("auth", Auth.isAuthenticated())
                    return (Auth.isAuthenticated() ? (
                            children
                        ) : (
                            <Redirect
                                to={{
                                    pathname: "/login",
                                    state: { from: location }
                                }}
                            />
                        )
                    )
                }
            }
        />
    );
}
