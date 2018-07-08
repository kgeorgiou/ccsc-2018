import React from 'react';
import './ChatContainer.css';

import {
    Button,
    Typography
} from '@material-ui/core';

import SendIcon from '@material-ui/icons/Send';

import imgFriendsCouch from '../../assets/images/friends_couch.svg'
import imgFriendsJump from '../../assets/images/friends_4.svg'

class ChatContainer extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            typingMessage: '',
            messages: []
        }
    }

    typeMessage(event) {
        this.setState({ typingMessage: event.target.value });
    }

    sendMessage() {
        const { typingMessage } = this.state;
        const { chatWith } = this.props;

        this.setState({
            typingMessage: '',
            messages: [...this.state.messages, { text: typingMessage, mine: true }],
        });

        this.props.onSendMessage(typingMessage, chatWith)
            .then(theirMsg => this.setState({
                messages: [...this.state.messages, { text: theirMsg, mine: false }],
            }))
    }

    handleOnKeyDown(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.sendMessage();
            return;
        }
    }

    renderChatContainer() {
        const { messages, typingMessage } = this.state;
        return (
            <div>
                <div className="messages">
                    {
                        messages.map(
                            (m, i) =>
                                <div key={i} className={m.mine ? "mine" : "theirs"}>
                                    <span className="messageBubble">{m.text}</span>
                                </div>
                        )
                    }
                </div>

                <div className="chatBox">
                    <textarea
                        placeholder="Type a message..."
                        onChange={this.typeMessage.bind(this)}
                        onKeyDown={this.handleOnKeyDown.bind(this)}
                        value={typingMessage}></textarea>
                    <Button className="btnSend" variant="fab" color="primary" aria-label="send"
                        onClick={this.sendMessage.bind(this)}
                    >
                        <SendIcon />
                    </Button>
                </div>
            </div>)
    }

    renderIdlePlaceholder() {
        return (
            <div className="chatPlaceholder">
                <Typography variant="display2" gutterBottom>
                    Your friends await!
                </Typography>
                {
                    Math.random() > 0.5
                        ? <img src={imgFriendsCouch} alt="friends on couch" />
                        : <img src={imgFriendsJump} alt="friends jumping" />
                }
            </div>
        )
    }

    render() {
        const { chatWith } = this.props;
        return (
            <div className="chatContainer">
                {
                    chatWith
                        ? this.renderChatContainer()
                        : this.renderIdlePlaceholder()
                }
            </div>
        )
    }
}

export default ChatContainer;