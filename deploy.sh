#!/bin/bash

# Variables
EC2_USER="ec2-user"
EC2_HOST="18.188.247.251"
KEY_PAIR="walkernest-key-pair.pem"
REMOTE_DIR="/home/ec2-user/walkernest"
NGINX_STATIC_DIR="frontend/dist"
DOCKER_COMPOSE_FILE="docker-compose.yml"

echo "🚀 Starting deployment process..."

# Step 1: Build the frontend locally
echo "📦 Building the frontend locally..."
cd frontend
npm install --legacy-peer-deps
npm run build
cd ..
echo "✅ Frontend build completed."

# Step 2: Copy the built static files to the EC2 instance
echo "📂 Copying built files to EC2 instance..."
scp -i $KEY_PAIR -r $NGINX_STATIC_DIR/ $EC2_USER@$EC2_HOST:$REMOTE_DIR/frontend
echo "✅ Files copied successfully."

# Step 3: SSH into the EC2 instance and run Docker Compose
echo "🐳 Deploying to EC2 instance..."
ssh -i $KEY_PAIR $EC2_USER@$EC2_HOST <<EOF
  # Navigate to the project directory
  cd $REMOTE_DIR

  echo "🧹 Running cleanup script..."
  if [ -f "./cleanup.sh" ]; then
    ./cleanup.sh
    echo "✅ Cleanup completed."
  else
    echo "⚠️ No cleanup.sh script found. Skipping cleanup."
  fi

  # Export environment variables for Docker Compose
  export FRONTEND_DOCKERFILE=frontend/Dockerfile.prod
  export NODE_ENV=production

  # Run Docker Compose
  docker-compose -f $DOCKER_COMPOSE_FILE up --build -d
EOF

echo "✅ Deployment completed successfully."

