import React from 'react';
import './WebsiteItem.css';
import Button from "@material-ui/core/Button/Button";

export default class WebsiteItem extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
        };
    }

    render () {
        let {website} = this.props;
        return (
            <div className="WebsiteItemRoot">
                <span className="WebsiteItemName">
                    {website.name}
                </span>
                <span className="WebsiteItemDescription">
                    {website.description}
                </span>
                <Button
                    className="WebsiteItemEditButton"
                    onClick={this.props.onEditClick}
                >
                    Edit Website
                </Button>
            </div>
        )
    }
}
