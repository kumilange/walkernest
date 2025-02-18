#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
else
  echo ".env file not found!"
  exit 1
fi

# Variables
REMOTE_DIR="/home/$USER/walkernest"
NGINX_STATIC_DIR="../frontend/dist"
FRONTEND_DOCKER_FILE="../frontend/Dockerfile"
BACKEND_DOCKER_API_FILE="../backend/Dockerfile"
BACKEND_APP_DIR="../backend/app"
SHARED_DIR="../shared"
ENV_FILE=".env"
CLEANUP_SCRIPT="cleanup.sh"
DOCKER_COMPOSE_FILE="docker-compose.yml"

echo "🚀 Starting deployment process..."

# Step 1: Build the frontend locally
echo "🛠️ Building the frontend locally..."
cd ../frontend
npm install --legacy-peer-deps
npm run build
cd ../ec2
echo "✅ Frontend build completed."

# Step 2: Create necessary directories on the EC2 instance
echo "📁 Creating necessary directories on the EC2 instance..."
ssh -i $KEY_PAIR_FILE $USER@$INSTANCE_IP <<EOF
  mkdir -p $REMOTE_DIR/frontend $REMOTE_DIR/backend $REMOTE_DIR/shared
EOF
echo "✅ Directories created successfully."

# Step 3: Copy files to the EC2 instance
echo "📤 Copying files to the EC2 instance..."
scp -i $KEY_PAIR_FILE $ENV_FILE $USER@$INSTANCE_IP:$REMOTE_DIR
scp -i $KEY_PAIR_FILE -r $NGINX_STATIC_DIR $USER@$INSTANCE_IP:$REMOTE_DIR/frontend
scp -i $KEY_PAIR_FILE $FRONTEND_DOCKER_FILE $USER@$INSTANCE_IP:$REMOTE_DIR/frontend
scp -i $KEY_PAIR_FILE $BACKEND_DOCKER_API_FILE $USER@$INSTANCE_IP:$REMOTE_DIR/backend
rsync -avz --exclude '__pycache__' -e "ssh -i $KEY_PAIR_FILE" $BACKEND_APP_DIR/ $USER@$INSTANCE_IP:$REMOTE_DIR/backend
scp -i $KEY_PAIR_FILE -r $SHARED_DIR $USER@$INSTANCE_IP:$REMOTE_DIR
echo "✅ Files copied successfully."

# Step 4: SSH into the EC2 instance and run Docker Compose
echo "🐳 Deploying to EC2 instance..."
ssh -i $KEY_PAIR_FILE $USER@$INSTANCE_IP <<EOF
  # Navigate to the project directory
  cd $REMOTE_DIR

  echo "🧹 Running cleanup script..."
  if [ -f "./$CLEANUP_SCRIPT" ]; then
    ./$CLEANUP_SCRIPT
    echo "✅ Cleanup completed."
  else
    echo "⚠️ No cleanup.sh script found. Skipping cleanup."
  fi

  # Run Docker Compose
  docker-compose -f $DOCKER_COMPOSE_FILE up --build -d

  # Check the status of the Docker containers
  docker ps
EOF

echo "📦 Deployment completed successfully! ✅"
