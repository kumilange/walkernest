#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Variables
INSTANCE_IP="3.147.92.139"
USER="ec2-user"
KEY_PAIR="walkernest-key-pair.pem"
REMOTE_DIR="/home/ec2-user/walkernest"

# Step 1: Upload the scripts and files to EC2 instance
echo "📤 Uploading files to EC2 instance..."
scp -i $KEY_PAIR docker_setup.sh postgres_setup.sh docker-compose.yml cleanup.sh deploy.sh seed.sh $USER@$INSTANCE_IP:$REMOTE_DIR

# Step 2: Log in to EC2 instance and configure
echo "🔑 Logging into EC2 instance to configure..."
ssh -i $KEY_PAIR $USER@$INSTANCE_IP << EOF
  set -e
  echo "🛠️ Changing permissions for uploaded scripts..."
  cd $REMOTE_DIR
  chmod +x docker_setup.sh postgres_setup.sh deploy.sh cleanup.sh seed.sh

  echo "🐋 Setting up Docker with docker_setup.sh..."
  ./docker_setup.sh
EOF

# Step 3: Run deploy.sh locally after exiting EC2
echo "📦 Running deploy.sh locally..."
./deploy.sh

# Step 4: Log back into EC2 and run postgres_setup.sh
echo "🔑 Logging back into EC2 to run postgres_setup.sh..."
ssh -i $KEY_PAIR $USER@$INSTANCE_IP << EOF
  set -e
  echo "🐘 Configuring PostgreSQL with postgres_setup.sh..."
  cd $REMOTE_DIR
  ./postgres_setup.sh
EOF

# Step 5: Run seed.sh locally after exiting EC2
echo "🌱 Running seed.sh locally..."
./seed.sh

echo "✅ All steps completed successfully!"
