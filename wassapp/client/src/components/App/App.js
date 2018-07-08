import React, { Component } from 'react';
import './App.css';
import axios from 'axios';

import { newECDH, getJWK, importJWK, deriveKeyECDH, encrypt, decrypt } from '../../utils/crypto';
import { putCryptoKey, getCryptoKey } from '../../utils/store';

import FriendList from '../../components/FriendList'
import ChatContainer from '../../components/ChatContainer'

import {
  AppBar,
  Toolbar,
  Typography
} from '@material-ui/core';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      chatWith: null,
    }
  }

  async sendMessage(myMsg, friend) {
    let myPrivateKey = await getCryptoKey("My-ECDH-Private");
    let theirPubCryptoKey = await getCryptoKey("Their-ECDH-Public");

    let encKey = await deriveKeyECDH(myPrivateKey, theirPubCryptoKey);
    let encMsg = await encrypt(encKey, myMsg);

    return axios.post('/api/reply', {
      to: friend,
      encMsg: encMsg
    }).then(async res => {
      const { ciphertext, iv } = res.data;
      let decMsg = await decrypt(encKey, iv, ciphertext);
      return decMsg;
    });
  }

  async handshakeWith(id) {
    let myPublicKey = await getCryptoKey("My-ECDH-Public");
    let myPrivateKey = await getCryptoKey("My-ECDH-Private");

    if (!myPublicKey || !myPrivateKey) {
      let myKeyPairECDH = await newECDH();
      await putCryptoKey("My-ECDH-Private", myKeyPairECDH.privateKey);
      await putCryptoKey("My-ECDH-Public", myKeyPairECDH.publicKey);

      myPublicKey = myKeyPairECDH.publicKey;
      myPrivateKey = myKeyPairECDH.privateKey;
    }

    let myPubJWK = await getJWK(myPublicKey);

    await axios.post('/api/handshake', {
      with: id,
      jwk: myPubJWK
    }).then(async (res) => {
      let theirPubJWK = res.data;
      let theirPubCryptoKey = await importJWK(theirPubJWK);
      await putCryptoKey("Their-ECDH-Public", theirPubCryptoKey);
    });
  }

  handleFriendSelection = async (id) => {
    await this.handshakeWith(id);
    this.setState({
      chatWith: id,
    });
  }

  render() {
    const { chatWith } = this.state;
    return (
      <div className="App">
        <AppBar position="fixed">
          <Toolbar>
            <Typography variant="title" color="inherit">
              WassApp
            </Typography>
          </Toolbar>
        </AppBar>
        <FriendList chatWith={chatWith} handleFriendSelection={this.handleFriendSelection.bind(this)} />
        <ChatContainer chatWith={chatWith} onSendMessage={this.sendMessage.bind(this)} />
      </div>
    );
  }
}

export default App;
