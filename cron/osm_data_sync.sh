#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Define the paths to the scripts
GENERATE_SEED_DATA_SCRIPT="../backend/data/generate_seed_data.py"
SEED_SCRIPT="../ec2/seed.sh"

# Run the generate_seed_data.py script
echo "🚀 Running generate_seed_data.py..."
python3 $GENERATE_SEED_DATA_SCRIPT

# Run the seed.sh script
echo "🌱 Running seed.sh..."
bash $SEED_SCRIPT

echo "✅ All steps completed successfully!"