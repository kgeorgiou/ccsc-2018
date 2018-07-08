import React from 'react';
import './IncompatibleBrowser.css';

import {
    AppBar,
    Toolbar,
    Typography
} from '@material-ui/core';

class IncompatibleBrowser extends React.Component {
    render() {
        const { browserName } = this.props;
        return (
            <div className="incompatible">
                <AppBar position="fixed">
                    <Toolbar>
                        <Typography variant="title" color="inherit">
                            WassApp
                        </Typography>
                    </Toolbar>
                </AppBar>
                <div className="incompatibleText">
                    <p>Our messaging service doesn't work on {browserName} yet.</p>
                    <p>Please use Chrome or Safari.</p>
                </div>
            </div>
        );
    }
}

export default IncompatibleBrowser;