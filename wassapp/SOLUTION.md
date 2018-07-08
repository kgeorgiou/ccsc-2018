## Exploration

WassApp is an End to End Encryption messaging service that uses ECDH key exchange between 2 friends to establish a secure connection and ensure that only the 2 friends can read the messages, even though the conversation takes place via an unsecure medium, the Internet.  

1. Visit the homepage. The UI is loaded. The user is already "logged in" their account and can see their friends list. Only 1 of our friends is available, the other 2 have blocked us (insignificant for the challenge)
2. We click on our only available friend:
    - The app checks if we have an ECDH keypair in IndexedDB, if not we generate a new ECDH keypair (with [Web Crypto API](https://www.w3.org/TR/WebCryptoAPI/)) and puts it in IndexedDB
    - A call to `/handshake` is initiated were we send our public ECDH JWK key and we receive the public ECDH JWK key of our friend (mocked by the server.) We import that key (with Web Crypto API) and also put it in IndexedDB
3. We send any message to our friend
4. The reply on the UI is encrypted (i.e. the app didn't decrypt the message)
6. Looking into the JS files of the page we find a comment from a rogue individual that removed the [decryption function](https://github.com/kgeorgiou/ccsc-2018/blob/7ea791a52c41fc0838777622025335b70e308c5b/wassapp/client/src/utils/crypto.js#L89-L105)

## Solution(s)  

The main idea is that the keys we need to decrypt incoming messages are already available in our end. It all boils down to how we access them and use them.

### Solution 1  

We can use the browser's console (or the debugger) to write some code (or re-use code from the existing JS files) that:   
- Reads the keys from IndexedDB  
- Performs the ECDH derivation using the Web Crypto API  
- Uses the derived secret to decrypt the incoming message replies  

We can enter the following helper functions (which can be found in the frontend code we already have) in our browser's console:
```
const _base64ToArrayBuffer = (base64) => {
    let binary_string = window.atob(base64);
    let len = binary_string.length;
    let bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

const _arrayBufferToBase64 = (buffer) => {
    let binary = '';
    let bytes = new Uint8Array(buffer);
    let len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

const _dbName = "WassAppDB";
const _objectStoreName = "WassAppObjectStore";

const getCryptoKey = (keyName) =>  {
    return new Promise(function (resolve, reject) {

        var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
        var open = indexedDB.open(_dbName, 1);

        open.onupgradeneeded = function () {
            var db = open.result;
            db.createObjectStore(_objectStoreName, {
                keyPath: "id"
            });
        };

        open.onsuccess = function () {
            var db = open.result;
            var tx = db.transaction(_objectStoreName, "readwrite");
            var store = tx.objectStore(_objectStoreName);

            var getKey = store.get(keyName);
            try {
                getKey.onsuccess = function () {
                    if (getKey.result !== undefined) {
                        resolve(getKey.result.cryptoKey);
                    } else {
                        resolve(null);
                    }
                };
            } catch (e) {
                resolve(null);
            }

            tx.oncomplete = function () {
                db.close();
            };
        }

    });
}

const myDecrypt = (iv, ciphertext) => {
    let textDecoder = new TextDecoder("utf-8");

    getCryptoKey("My-ECDH-Private").then(myKey => {
        getCryptoKey("Their-ECDH-Public").then(theirKey => {

            window.crypto.subtle.deriveKey(
                {
                    name: "ECDH",
                    namedCurve: "P-256",
                    public: theirKey,
                },
                myKey,
                {
                    name: "AES-CBC",
                    length: 256,
                },
                false,
                ["encrypt", "decrypt"]
            ).then((cryptoKey) => {

                let i = _base64ToArrayBuffer(iv);
                let c = _base64ToArrayBuffer(ciphertext);

                window.crypto.subtle.decrypt(
                    {
                        name: "AES-CBC",
                        iv: i,
                    },
                    cryptoKey,
                    c
                ).then(function (decrypted) {
                    console.log(`Decrypted Message: ${textDecoder.decode(decrypted)}`);
                })
            })
        })
    }) 
}
```

Once we have the above helper functions in place, we can grab the IV and ciphertext received from each reply and do the following in the console:
```
> myDecrypt("PIxjohYmYYBZ3xzCGjm2VA==", "eH3H9iesiGhH6ccv+eLdwOYHT/AYcHEE2wYAqJ55QXtKpXOdMEz+RXa8uxZ46E3M0SprDHcprKY8vLKBPHTWCQ==")
Decrypted Message: brb
CYCTF{end2end_r0cks__unt1l_th3_end_1s_compromis3d}
```


### Solution 2  

Since there's no authentication involved in the ECDH handshake, we can create our own ECDH keypair outside the browser, and use that public key for the `/handshake` request and decrypt incoming replies with the respective private key.
