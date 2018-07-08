## Scenario

> The super secure messaging service you use to talk with your friend seems a bit flaky today.

## Solution

The solution can be found [here](./SOLUTION.md).  

## Notes  

This challenge won't work on Firefox because of a bug with saving EC private keys in IndexedDB: https://bugzilla.mozilla.org/show_bug.cgi?id=1379493  

There's a browser detection in place that prompts about the service not being available on Firefox.  

The solution was tested and confirmed on Chrome and Safari.  

## Deployment

### Client
- [nvm](https://github.com/creationix/nvm)  
- [yarn](https://yarnpkg.com/lang/en/)  

```
$ cd client
$ yarn install
$ yarn build
```

### Server
- [Go 1.10.x](https://golang.org/doc/install)   
- [Go dep](https://github.com/golang/dep)   
  
I believe the project must reside under the $GOPATH for `go dep` to work.  
  
```
cd server  
go dep ensure  
go build  
./server  
```
