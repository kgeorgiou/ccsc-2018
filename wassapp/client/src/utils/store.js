
const _dbName = "WassAppDB";
const _objectStoreName = "WassAppObjectStore";

export const getCryptoKey = (keyName) =>  {
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

export const putCryptoKey = (kid, cryptoKey) => {

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

            try {
                store.put({
                    id: kid,
                    cryptoKey: cryptoKey
                });
                resolve();
            } catch (e) {
                reject(e);
            }

            tx.oncomplete = function () {
                db.close();
            };
        }

    });

}