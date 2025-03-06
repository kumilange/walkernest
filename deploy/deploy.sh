#!/bin/sh

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
REMOTE_DIR="/home/$USER/walkernest"
FRONTEND_STATIC_DIR="../frontend/dist"
FRONTEND_DOCKER_FILE="../frontend/Dockerfile"
BACKEND_DOCKER_API_FILE="../backend/Dockerfile"
BACKEND_APP_DIR="../backend/app"
BACKEND_REQUIREMENTS_FILE="../backend/requirements.txt"
SHARED_DIR="../shared"
NGINX_DIR="./nginx"
ENV_FILE=".env"
CLEANUP_SCRIPT="cleanup.sh"
DOCKER_COMPOSE_FILE="docker-compose.yml"

echo "🚀 Starting deployment process..."

# Step 1: Build the frontend locally
echo "🛠️ Building the frontend locally..."
cd ../frontend
npm install --legacy-peer-deps
npm run build
cd ../deploy

# Step 2: Create necessary directories on the EC2 instance
echo "📁 Creating necessary directories on the EC2 instance..."
ssh -i $KEY_PAIR_FILE $USER@$INSTANCE_IP <<EOF
  sudo mkdir -p $REMOTE_DIR/frontend $REMOTE_DIR/backend $REMOTE_DIR/shared $REMOTE_DIR/nginx $REMOTE_DIR/certbot/conf $REMOTE_DIR/certbot/www/.well-known/acme-challenge
  sudo chown -R $USER:$USER $REMOTE_DIR
EOF

# Step 3: Copy files to the EC2 instance
echo "📤 Copying files to the EC2 instance..."
scp -i $KEY_PAIR_FILE -r $SHARED_DIR $USER@$INSTANCE_IP:$REMOTE_DIR
scp -i $KEY_PAIR_FILE -r $NGINX_DIR $USER@$INSTANCE_IP:$REMOTE_DIR
scp -i $KEY_PAIR_FILE -r $FRONTEND_STATIC_DIR $USER@$INSTANCE_IP:$REMOTE_DIR/frontend
scp -i $KEY_PAIR_FILE $FRONTEND_DOCKER_FILE $USER@$INSTANCE_IP:$REMOTE_DIR/frontend
scp -i $KEY_PAIR_FILE $BACKEND_DOCKER_API_FILE $USER@$INSTANCE_IP:$REMOTE_DIR/backend
scp -i $KEY_PAIR_FILE $BACKEND_REQUIREMENTS_FILE $USER@$INSTANCE_IP:$REMOTE_DIR/backend
rsync -avz --exclude '__pycache__' -e "ssh -i $KEY_PAIR_FILE" $BACKEND_APP_DIR $USER@$INSTANCE_IP:$REMOTE_DIR/backend

# Step 4: SSH into the EC2 instance and run Docker Compose
echo "🐳 Deploying to EC2 instance..."
ssh -i $KEY_PAIR_FILE $USER@$INSTANCE_IP <<EOF
  # Navigate to the project directory
  cd $REMOTE_DIR

  echo "🧹 Running cleanup script..."
  sudo ./$CLEANUP_SCRIPT

  # Step 1: Start docker containers
  echo "🐳 Starting containers..."
  docker-compose up --build -d

  # Step 2: Restart nginx
  echo "🔄 Restarting Nginx..."
  docker-compose restart nginx

  # Step 3: Check the status of all containers to ensure everything is up
  echo "🐳 Checking all containers status..."
  docker ps
EOF

echo "📦 Deployment completed successfully! ✅"
