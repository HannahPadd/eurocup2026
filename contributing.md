# Contributing
Thank you for wanting to contribute ^-^

## Dependencies
- NodeJS v22.22.0 LTS
- Docker
## Server

### Linux/OS X
To run the server run db.sh
```
chmod +x db.sh
./db.sh
```
The docker script is provided for convenience.

### Windows
```
docker compose -f docker-compose-db.yaml up -d
```

This creates a database for the server to connect to.
Go to the `tournament_server` directory and run
```
npm i
npm run start:dev
```
The server should now start and connnect to the database.

## Viewer
First start the server then go to the tournament_viewer directory and run
```
npm i
npm run dev
```
This starts the viewer in watch mode so you can live preview changes
Navigate to the viewer by going to http://localhost:5173

## Next steps
After you're done run build-testing.sh to test if building still works.
If everything looks good feel free to open a PR. All PR's are welcome ^-^
