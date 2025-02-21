#!/bin/sh

# Exit on error, unset variable, or pipeline failure
set -euo pipefail
trap 'echo "❌ Script failed at line $LINENO with exit code $?"' ERR

# Load environment variables from .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
else
  echo ".env file not found!"
  exit 1
fi

# Variables
ENV_FILE=".env"
DOCKER_COMPOSE_FILE="docker-compose-dev.yml"
SEED_SCRIPT="../seed/seed.sh"

# Step 1: Run docker compose locally
echo "🐳 Running docker compose..."
docker-compose -f $DOCKER_COMPOSE_FILE up --build -d

# Step 5: Seed database locally
echo "🌱 Running seeding..."
set -a
. ./$ENV_FILE
set +a
./$SEED_SCRIPT

echo "✅ All steps completed successfully!"
