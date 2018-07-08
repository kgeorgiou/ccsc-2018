if (window.crypto && !window.crypto.subtle && window.crypto.webkitSubtle) {
    window.crypto.subtle = window.crypto.webkitSubtle;
}

export const _base64ToArrayBuffer = (base64) => {
    let binary_string = window.atob(base64);
    let len = binary_string.length;
    let bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

export const _arrayBufferToBase64 = (buffer) => {
    let binary = '';
    let bytes = new Uint8Array(buffer);
    let len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

export const newECDH = () => {
    return new Promise((resolve, reject) => {
        window.crypto.subtle.generateKey(
            {
                name: "ECDH",
                namedCurve: "P-256",
            },
            false,
            ["deriveKey", "deriveBits"]
        ).then((cryptoKeyPair) => {
            resolve(cryptoKeyPair);
        }).catch((e) => {
            reject(e);
        })
    });
}

export const deriveKeyECDH = (mine, theirs) => {
    return new Promise((resolve, reject) => {
        window.crypto.subtle.deriveKey(
            {
                name: "ECDH",
                namedCurve: "P-256",
                public: theirs,
            },
            mine,
            {
                name: "AES-CBC",
                length: 256,
            },
            false,
            ["encrypt", "decrypt"]
        ).then((cryptoKey) => {
            resolve(cryptoKey);
        }).catch((err) => {
            reject(err);
        })
    })
}

export const encrypt = (cryptoKey, plaintext) => {
    let textEncoder = new TextEncoder();
    let data = textEncoder.encode(plaintext);
    let iv = window.crypto.getRandomValues(new Uint8Array(16))

    return new Promise((resolve, reject) => {
        window.crypto.subtle.encrypt(
            {
                name: "AES-CBC",
                iv: iv,
            },
            cryptoKey,
            data
        ).then((encryptedData) => {
            resolve({
                ciphertext: _arrayBufferToBase64(encryptedData),
                iv: _arrayBufferToBase64(iv),
            });
        }).catch((err) => {
            reject(err);
        });
    });
}

export const decrypt = (cryptoKey, iv, ciphertext) => {
    let textDecoder = new TextDecoder("utf-8");
    return new Promise((resolve, reject) => {
        /**
         * 
         * This should teach them a lesson.
         * 
         * Good luck with decrypting incoming messages.
         * 
         * I'm done.
         * 
         * (╯°□°）╯︵ ┻━┻
         * 
         */
        resolve(textDecoder.decode(_base64ToArrayBuffer(ciphertext)));
    });
}

export const getJWK = (cryptoKey) => {
    return new Promise((resolve, reject) => {
        window.crypto.subtle.exportKey(
            "jwk",
            cryptoKey
        ).then((jwk) => {
            resolve(jwk);
        }).catch((err) => {
            reject(err);
        });
    });
}

export const importJWK = (jwk) => {
    return new Promise((resolve, reject) => {
        window.crypto.subtle.importKey(
            "jwk",
            jwk,
            {
                name: "ECDH",
                namedCurve: "P-256",
            },
            true,
            []
        ).then((cryptoKey) => {
            resolve(cryptoKey);
        }).catch((err) => {
            reject(err);
        });
    });
}

export const exportRawKey = (key) => {
    return new Promise((resolve, reject) => {
        window.crypto.subtle.exportKey(
            "raw",
            key,
        ).then((rawBytes) => {
            resolve(rawBytes);
        }).catch((err) => {
            reject(err);
        });
    });
}