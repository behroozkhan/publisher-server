import React from 'react';
import TextField from "@material-ui/core/TextField/TextField";
import Button from "@material-ui/core/Button/Button";
import './Login.css';
import Paper from "@material-ui/core/Paper/Paper";
import Auth from "../Auth";
import config from '../../Config/config.json';

export default class Login extends React.Component {
    constructor (props) {
        super(props);

        this.state = {

        };
    }

    onLoginClick = (e) => {
        Auth.authenticate(this.username, this.password, (success, error) => {
            if (success) {
                this.props.router.redirect("/dashboard");
            } else {
                console.log("login error", error)
            }
        });
    };

    render () {
        return (
            <div className="LoginPage">
                <Paper className="LoginBoundary">
                    <span className="LoginTitle">
                        {config.BrandName} Website Builder
                    </span>
                    <TextField
                        className="LoginUsername"
                        label="Username" variant="outlined" size="small"
                        onChange={(e) => {
                            this.username = e.target.value;
                        }}
                    />
                    <TextField
                        className="LoginPassword"
                        label="Password" variant="outlined" size="small"
                        onChange={(e) => {
                            this.password = e.target.value;
                        }}
                    />

                    <div className="LoginButtonsContainer">
                        <Button
                            className="LoginEnter"
                            variant="contained" color="primary"
                            onClick={this.onLoginClick}
                        >
                            Enter
                        </Button>
                        <Button
                            className="LoginRegister"
                            color="primary"
                        >
                            Register
                        </Button>
                    </div>
                </Paper>
            </div>
        )
    }
}
