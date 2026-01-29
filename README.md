# Eurocup2026
Software for managing tournaments. Mainly developed for use with the itg eurocup tournament.


## Building
First make sure you have docker installed.

Clone the repo
```
git clone https://github.com/HannahPadd/eurocup2026.git
```

### Linux/OS X
```
chmod +x build-testing.sh
./build-testing.sh
```

### Windows
```
docker compose -f docker-compose-testing.yaml build --no-cache
docker compose -f docker-compose-testing.yaml up
```
Navigate to the viewer by going to 
http://127.0.0.1:80

## Contributing
[Contributing](https://github.com/HannahPadd/eurocup2026/blob/main/contributing.md)
