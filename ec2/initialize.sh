#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Load environment variables from .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
else
  echo ".env file not found!"
  exit 1
fi

# Variables
ENV_FILE=".env"
REMOTE_DIR="/home/$USER/walkernest"
DEPLOY_SCRIPT="deploy.sh"
DOCKER_SETUP_SCRIPT="docker_setup.sh"
DOCKER_COMPOSE_FILE="docker-compose.yml"
POSTGRES_SETUP_SCRIPT="postgres_setup.sh"
CLEANUP_SCRIPT="cleanup.sh"
SEED_SCRIPT="seed.sh"

# Ensure the private key file has the correct permissions
chmod 600 $KEY_PAIR_FILE

# Step 1: Upload the scripts and files to EC2 instance
echo "📤 Uploading files to EC2 instance..."
scp -i $KEY_PAIR_FILE $DOCKER_SETUP_SCRIPT $POSTGRES_SETUP_SCRIPT $DEPLOY_SCRIPT $CLEANUP_SCRIPT $SEED_SCRIPT $DOCKER_COMPOSE_FILE $ENV_FILE $USER@$INSTANCE_IP:$REMOTE_DIR

# Step 2: Log in to EC2 instance and configure
echo "🔑 Logging into EC2 instance to configure..."
ssh -i $KEY_PAIR_FILE $USER@$INSTANCE_IP << EOF
  set -e  chmod 600 $KEY_PAIR_FILE
  echo "🛠️ Changing permissions for uploaded scripts..."
  cd $REMOTE_DIR
  chmod +x $DOCKER_SETUP_SCRIPT $POSTGRES_SETUP_SCRIPT $DEPLOY_SCRIPT $CLEANUP_SCRIPT $SEED_SCRIPT

  echo "🐋 Setting up Docker with docker_setup.sh..."
  ./$DOCKER_SETUP_SCRIPT
EOF

# Step 3: Run deploy.sh locally after exiting EC2
echo "📦 Running deploy.sh locally..."
./$DEPLOY_SCRIPT

# Step 4: Log back into EC2 and run postgres_setup.sh
echo "🔑 Logging back into EC2 to run postgres_setup.sh..."
ssh -i $KEY_PAIR_FILE $USER@$INSTANCE_IP << EOF
  set -e
  echo "🐘 Configuring PostgreSQL with postgres_setup.sh..."
  cd $REMOTE_DIR
  ./$POSTGRES_SETUP_SCRIPT
EOF

# Step 5: Run seed.sh locally after exiting EC2
echo "🌱 Running seed.sh locally..."
./$SEED_SCRIPT

echo "✅ All steps completed successfully!"
