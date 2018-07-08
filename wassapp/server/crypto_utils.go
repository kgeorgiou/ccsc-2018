package main

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"math/big"
)

func encrypt(message []byte, iv []byte, theirPublic *ecdsa.PublicKey, myPrivate *ecdsa.PrivateKey) ([]byte, error) {
	secretBytes := deriveSecretFromECDH(theirPublic, myPrivate)

	block, err := aes.NewCipher(secretBytes)
	if err != nil {
		return nil, err
	}

	message, err = pkcs7Pad(message, block.BlockSize())

	dst := make([]byte, len(message))
	mode := cipher.NewCBCEncrypter(block, iv)
	mode.CryptBlocks(dst, message)

	return dst, nil
}

func deriveSecretFromECDH(theirPublic *ecdsa.PublicKey, myPrivate *ecdsa.PrivateKey) []byte {
	secret, _ := elliptic.P256().ScalarMult(theirPublic.X, theirPublic.Y, privateKey.D.Bytes())
	return secret.Bytes()
}

func parsePublicEcdhJWK(jwk *ecdhJWK) *ecdsa.PublicKey {
	xData, _ := base64.RawURLEncoding.DecodeString(jwk.X)
	xBig := new(big.Int)
	xBig.SetBytes(xData)

	yData, _ := base64.RawURLEncoding.DecodeString(jwk.Y)
	yBig := new(big.Int)
	yBig.SetBytes(yData)

	return &ecdsa.PublicKey{
		Curve: elliptic.P256(),
		X:     xBig,
		Y:     yBig,
	}
}

func pkcs7Pad(input []byte, k int) ([]byte, error) {
	if !(k > 1) {
		return nil, fmt.Errorf("k must be greater than one - RFC5652")
	}
	if !(k < 256) {
		return nil, fmt.Errorf("this padding method is well defined if and only if k is less than 256 - RFC5652")
	}

	lth := len(input)
	paddingOctet := k - lth%k
	for i := 0; i < paddingOctet; i++ {
		input = append(input, byte(paddingOctet))
	}
	return input, nil
}

func pseudoUUID() (string, error) {
	b := make([]byte, 16)
	_, err := rand.Read(b)
	if err != nil {
		return "", fmt.Errorf("error generating uuid")
	}

	return fmt.Sprintf("%X", b), nil
}
