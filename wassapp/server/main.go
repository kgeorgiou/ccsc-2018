package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io/ioutil"
	mrand "math/rand"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/sessions"
	validator "gopkg.in/go-playground/validator.v9"

	"github.com/spf13/viper"
	jose "github.com/square/go-jose"
)

var (
	port              string
	flag              string
	flagProbability   int
	replies           []string
	friends           map[string]interface{}
	mockReplyDelay    int
	privateKey        *ecdsa.PrivateKey
	maxSessionEntries int
	sessionKey        []byte
	sessionStore      *sessions.CookieStore
	publicKeyCache    = map[string]*ecdsa.PublicKey{}
	validate          = validator.New()
)

func init() {
	// read config params
	viper.SetConfigFile("./config/config.yaml")
	err := viper.ReadInConfig()
	if err != nil {
		os.Exit(1)
	}
	port = viper.GetString("http.port")
	flag = viper.GetString("flag.value")
	flagProbability = viper.GetInt("flag.probability")
	replies = viper.GetStringSlice("replies")
	friends = viper.GetStringMap("friends")
	mockReplyDelay = viper.GetInt("mockReplyDelay")
	maxSessionEntries = viper.GetInt("maxSessionEntries")

	// initialize session management
	sessionKey = make([]byte, 16)
	rand.Read(sessionKey)
	sessionStore = sessions.NewCookieStore(sessionKey)

	// generate our private EC key
	privateKey, _ = ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
}

type ecdhJWK struct {
	Kty string `json:"kty" validate:"required"`
	Crv string `json:"crv" validate:"required"`
	X   string `json:"x" validate:"required"`
	Y   string `json:"y" validate:"required"`
	D   string `json:"d,omitempty"`
}

type encryptedMessage struct {
	IV         string `json:"iv" validate:"required"`
	Ciphertext string `json:"ciphertext" validate:"required"`
}

type handshakeRequest struct {
	With string   `json:"with" validate:"required"`
	JWK  *ecdhJWK `json:"jwk" validate:"required"`
}

type messageRequest struct {
	To         string            `json:"to" validate:"required"`
	EncMessage *encryptedMessage `json:"encMsg" validate:"required"`
}

func main() {
	http.Handle("/", http.FileServer(http.Dir("../client/build")))
	http.HandleFunc("/api/handshake", handshake)
	http.HandleFunc("/api/reply", reply)

	if err := http.ListenAndServe(port, nil); err != nil {
		panic(err)
	}
}

func handshake(w http.ResponseWriter, r *http.Request) {
	b, err := ioutil.ReadAll(r.Body)
	defer r.Body.Close()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	req := new(handshakeRequest)
	err = json.Unmarshal(b, req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = validate.Struct(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if _, isFriend := friends[req.With]; !isFriend {
		http.Error(w, "not your friend", http.StatusUnauthorized)
		return
	}

	theirPublicKey := parsePublicEcdhJWK(req.JWK)

	uid, _ := pseudoUUID()

	// Check if the cache of public keys has reached the limit.
	// Necessary measure to keep the memory footprint of the server low.
	// The downside with resetting the cache like this, some of the active
	// keys will be invalidated. New ones can be acquired by /handshaking again.
	if len(publicKeyCache) >= maxSessionEntries {
		publicKeyCache = map[string]*ecdsa.PublicKey{}
	}
	publicKeyCache[uid] = theirPublicKey

	session, _ := sessionStore.Get(r, "session")
	session.Values["uid"] = uid
	session.Save(r, w)

	// return my public JWK
	jwk := jose.JSONWebKey{Key: &privateKey.PublicKey}
	jwkJSON, err := jwk.MarshalJSON()
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	w.Header().Set("content-type", "application/json")
	w.Write(jwkJSON)
}

func reply(w http.ResponseWriter, r *http.Request) {
	b, err := ioutil.ReadAll(r.Body)
	defer r.Body.Close()
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	req := new(messageRequest)
	err = json.Unmarshal(b, req)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	err = validate.Struct(req)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	if _, isFriend := friends[req.To]; !isFriend {
		http.Error(w, "not your friend", http.StatusUnauthorized)
		return
	}

	session, _ := sessionStore.Get(r, "session")
	uid, ok := session.Values["uid"].(string)
	if !ok || len(uid) == 0 {
		http.Error(w, "I don't know who you are", http.StatusUnauthorized)
		return
	}

	theirPublicKey, ok := publicKeyCache[uid]
	if !ok || theirPublicKey == nil {
		http.Error(w, "I don't know who you are", http.StatusUnauthorized)
		return
	}

	replyIndex := mrand.Intn(len(replies))
	returnFlag := mrand.Intn(flagProbability) == 0 // 1 in `flagProbability` chance

	replyMsg := replies[replyIndex]

	if returnFlag {
		replyMsg = fmt.Sprintf("%s\n%s", replyMsg, flag)
	}

	ivBytes := make([]byte, 16)
	rand.Read(ivBytes)
	ciphertext, err := encrypt([]byte(replyMsg), ivBytes, theirPublicKey, privateKey)
	if err != nil {
		http.Error(w, "something is wrong", 500)
	}

	ivBase64 := base64.StdEncoding.EncodeToString(ivBytes)
	ciphertextBase64 := base64.StdEncoding.EncodeToString(ciphertext)

	myReply := &encryptedMessage{
		IV:         ivBase64,
		Ciphertext: ciphertextBase64,
	}
	myReplyJSON, _ := json.Marshal(myReply)

	// mock typing delay before replying
	time.Sleep(time.Duration(mrand.Intn(mockReplyDelay)) * time.Second)

	w.Header().Set("content-type", "application/json")
	w.Write(myReplyJSON)
}
