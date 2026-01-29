# Contributing

## Server
To run the server run db.sh
```
./db.sh
```
This creates a database for the server to connect to.
Go to the tournament_viewer directory and run
```
npm i
npm run start
```
The server should now start and connnect to the database.

## Viewer
First start the server then go to the tournament_viewer directory and run
```
npm i
npm run dev
```
This starts the viewer in watch mode so you can live preview changes.

## Next steps
After you're done run build-testing.sh to test if building still works.
