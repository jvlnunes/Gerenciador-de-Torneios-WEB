set -euo pipefail
cd "$(dirname "$0")"

git fetch origin
git reset --hard origin/main

docker compose build api
docker compose up -d
docker image prune -f

sleep 5
docker compose logs --tail 15 api
curl -fsS http://127.0.0.1:3000/ && echo " <- API ok"