docker compose down
docker compose -f docker-compose-testing.yaml build --no-cache
docker compose -f docker-compose-testing.yaml up

