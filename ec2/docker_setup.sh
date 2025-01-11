#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Update and install Docker
sudo yum update -y
sudo yum install docker -y
sudo service docker start
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep tag_name | cut -d '"' -f 4)/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version

# Set permissions for the working directory
chmod -R 755 /home/ec2-user/walkernest
cd /home/ec2-user/walkernest

echo "🐋 Docker setup completed successfully! ✅"
