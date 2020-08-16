import React from 'react';
import './Dashboard.css';
import Server from "../../Server";
import WebsiteItem from "./WebsiteItem";
import Button from "@material-ui/core/Button/Button";
import NewWebsiteModal from "./NewWebsiteModal";

export default class EditorHolder extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
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
        //TODO request editor
    };

    render () {
        return (
            <div className="EditorHolderPage">
                <div className="EditorHolderHeader">

                </div>
                <div className="EditorHolderIFrame">

                </div>
            </div>
        )
    }
}
