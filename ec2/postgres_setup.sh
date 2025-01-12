#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Configure PostgreSQL (postgresql.conf)
docker cp postgis-db:/etc/postgresql/16/main/postgresql.conf ./postgresql.conf

# Update PostgreSQL configuration in one go
cat <<EOF >> postgresql.conf
listen_addresses = '*'
work_mem = 1MB
maintenance_work_mem = 16MB
checkpoint_completion_target = 0.9
EOF

docker cp ./postgresql.conf postgis-db:/etc/postgresql/16/main/postgresql.conf
docker exec postgis-db bash -c "chown postgres:postgres /etc/postgresql/16/main/postgresql.conf"

# Configure PostgreSQL authentication (pg_hba.conf)
docker cp postgis-db:/etc/postgresql/16/main/pg_hba.conf ./pg_hba.conf
sed -i "s/local   all             all                                     peer/local   all             all                                     md5/g" pg_hba.conf
sed -i "s/host    all             all             127.0.0.1\/32            scram-sha-256/host    all             all             0.0.0.0\/0               md5/g" pg_hba.conf
sed -i "s/host    all             all             ::1\/128                 scram-sha-256/host    all             all             ::\/0                    md5/g" pg_hba.conf
docker cp ./pg_hba.conf postgis-db:/etc/postgresql/16/main/pg_hba.conf

# Add swap space
echo "Adding swap space..."
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Restart the PostGIS container to apply changes
docker restart postgis-db

# Wait for PostGIS to restart
echo "Waiting for PostGIS to restart..."
sleep 20

# Check the status of the Docker containers
docker ps

echo "✅ Setup postgres complete!"
