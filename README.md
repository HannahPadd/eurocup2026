# Eurocup2026
Software for managing tournaments (built for ITG Eurocup workflows).

## What Is In This Repo
- `tournament_server`: NestJS + TypeORM + MariaDB API (REST + websocket updates)
- `tournament_viewer`: React + Vite frontend for viewing and managing tournaments

## Run application with Docker
Make sure Docker is installed.

```bash
git clone https://github.com/HannahPadd/eurocup2026.git
cd eurocup2026
docker compose up
```

Open:
- Viewer (Main application): [http://127.0.0.1:8401](http://127.0.0.1:8401)
- API: [http://127.0.0.1:8402](http://127.0.0.1:8402)
- PhpMyAdmin: [http://127.0.0.1:8403](http://127.0.0.1:8403)

## Run application without Docker
You will still need a database, here's how you can run just the database with docker
```bash
docker compose -f docker-compose-db.yaml up
``

```bash
git clone https://github.com/HannahPadd/eurocup2026.git
cd eurocup2026
npm i
npm start
```

## Notes
- Main tournament management UI is in `/manage` (General tab handles divisions/phases/matches).
- Public/streamed tournament view is in `/tournament`.
- Qualifier-related flows are available in both viewer and admin manage pages.

## Contributing
[Contributing](https://github.com/HannahPadd/eurocup2026/blob/main/contributing.md)
