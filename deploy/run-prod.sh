#!/bin/sh

# Exit on error, unset variable, or pipeline failure
set -euo pipefail
trap 'echo "❌ Script failed at line $LINENO with exit code $?"' ERR

# Load environment variables from .env file
if [ -f ../.env ]; then
  export $(cat ../.env | grep -v '#' | awk '/=/ {print $1}')
else
  echo "../.env file not found!"
  exit 1
fi

# Variables
ENV_FILE="../.env"
REMOTE_DIR="/home/$USER/walkernest"
DEPLOY_SCRIPT="deploy.sh"
DOCKER_SETUP_SCRIPT="docker-setup.sh"
DOCKER_COMPOSE_FILE="docker-compose.yml"
POSTGRES_SETUP_SCRIPT="postgres-setup.sh"
CLEANUP_SCRIPT="cleanup.sh"
SEED_SCRIPT="../seed/seed.sh"

# Ensure the private key file has the correct permissions
chmod 600 $KEY_PAIR_FILE

# Step 1: Upload the scripts and files to EC2 instance
echo "🧹 Deleting existing files on EC2 instance..."
ssh -t -i $KEY_PAIR_FILE $USER@$INSTANCE_IP << EOF
  set -e
  sudo rm -rf $REMOTE_DIR
  sudo mkdir -p $REMOTE_DIR
  sudo chown -R $USER:$USER $REMOTE_DIR
EOF

echo "📤 Uploading files to EC2 instance..."
scp -i $KEY_PAIR_FILE $DOCKER_SETUP_SCRIPT $POSTGRES_SETUP_SCRIPT $CLEANUP_SCRIPT $DOCKER_COMPOSE_FILE $ENV_FILE $USER@$INSTANCE_IP:$REMOTE_DIR

# Step 2: Log in to EC2 instance and configure scripts
echo "🔑 Logging into EC2 instance..."
ssh -t -i $KEY_PAIR_FILE $USER@$INSTANCE_IP << EOF
  set -e  chmod 600 $KEY_PAIR_FILE
  echo "🛠️ Changing permissions for uploaded scripts..."
  cd $REMOTE_DIR
  sudo chmod +x $DOCKER_SETUP_SCRIPT  $POSTGRES_SETUP_SCRIPT $CLEANUP_SCRIPT

  echo "🐳 Setting up Docker..."
  sudo ./$DOCKER_SETUP_SCRIPT
EOF

# Step 3: Deploy application to EC2 instance
echo "📦 Deploying application..."
./$DEPLOY_SCRIPT

# Step 4: Log back into EC2 instance and set up PostgreSQL
echo "🔑 Logging back into EC2 instance..."
ssh -t -i $KEY_PAIR_FILE $USER@$INSTANCE_IP << EOF
  set -e
  echo "🐘 Setting up PostgreSQL..."
  cd $REMOTE_DIR
  sudo ./$POSTGRES_SETUP_SCRIPT
EOF

# Step 5: Seed database on EC2 instance
echo "🌱 Seeding database..."
set -a
. ./$ENV_FILE
set +a
./$SEED_SCRIPT

echo "✅ All steps completed successfully!"
