import React from 'react';
import './FriendList.css';

import {
    List,
    ListItem,
    ListItemText,
    Avatar,
    Divider
} from '@material-ui/core';

import avatarBigHead from '../../assets/images/photo-big-head.png'
import avatarDinesh from '../../assets/images/photo-dinesh.png'
import avatarGilfoyle from '../../assets/images/photo-gilfoyle.png'

import imgOrdinaryDay from '../../assets/images/ordinary_day.svg'

class FriendList extends React.Component {

    render() {
        const { chatWith, handleFriendSelection } = this.props;
        return (
            <div className="friendListContainer">
                <div className="friendsHeading">
                    <img src={imgOrdinaryDay} alt="ordinary day" height="50" width="auto" />
                </div>
                <List>
                    <Divider component="li" />
                    <ListItem
                        style={{
                            background: chatWith === '1842042' ? '#ddd' : '',
                            cursor: 'pointer'
                        }}
                        onClick={() => handleFriendSelection('1842042')}
                    >
                        <Avatar src={avatarBigHead} />
                        <ListItemText primary="Nelson Bighetti" secondary="Online" />
                    </ListItem>

                    <Divider component="li" />
                    <ListItem>
                        <Avatar src={avatarGilfoyle} />
                        <ListItemText primary="Bertram Gilfoyle" secondary="Blocked" />
                    </ListItem>

                    <Divider component="li" />
                    <ListItem>
                        <Avatar src={avatarDinesh} />
                        <ListItemText primary="Dinesh Chugtai" secondary="Blocked" />
                    </ListItem>

                    <Divider component="li" />
                </List>

                <div className="footNote">
                    <p><a href="/pages/hiring.html" target="_blank">We are hiring!</a></p>
                    <p>Made with <span role="img" aria-label="red heart emoji">❤️</span> and <span role="img" aria-label="coffee emoji">☕</span>.</p>
                </div>
            </div>
        )
    }
}

export default FriendList;