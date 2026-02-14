# Eurocup2026
Software for managing tournaments (built for ITG Eurocup workflows).

## What Is In This Repo
- `tournament_server`: NestJS + TypeORM + MariaDB API (REST + websocket updates)
- `tournament_viewer`: React + Vite frontend for viewing and managing tournaments

## Quick Start (Docker)
Make sure Docker is installed.

Clone the repo
```bash
git clone https://github.com/HannahPadd/eurocup2026.git
```

### Linux/OS X
```bash
chmod +x build-testing.sh
./build-testing.sh
```

### Windows
```bash
docker compose -f docker-compose-testing.yaml build --no-cache
docker compose -f docker-compose-testing.yaml up
```

Open:
- Viewer: [http://127.0.0.1:80](http://127.0.0.1:80)
- API: [http://127.0.0.1:3000](http://127.0.0.1:3000)
- Adminer: [http://127.0.0.1:8080](http://127.0.0.1:8080)

## Local Dev (without full Docker stack)
- DB only: `./db.sh` or `docker compose -f docker-compose-db.yaml up -d`
- Server:
```bash
cd tournament_server
npm install
npm run start:dev
```
- Viewer:
```bash
cd tournament_viewer
npm install
npm run dev
```
Viewer dev URL: [http://127.0.0.1:5173](http://127.0.0.1:5173)

## Notes
- Main tournament management UI is in `/manage` (General tab handles divisions/phases/matches).
- Public/streamed tournament view is in `/tournament`.
- Qualifier-related flows are available in both viewer and admin manage pages.

## Contributing
[Contributing](https://github.com/HannahPadd/eurocup2026/blob/main/contributing.md)
