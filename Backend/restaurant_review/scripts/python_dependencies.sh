#!/usr/bin/env bash
set -e

PROJECT_MAIN_DIR_NAME="team-project-20201-code-avengers/Backend"

# Validate variables
if [ -z "$PROJECT_MAIN_DIR_NAME" ]; then
    echo "Error: PROJECT_MAIN_DIR_NAME is not set. Please set it to your project directory name." >&2
    exit 1
fi

# Change ownership to ec2-user:ec2-user user
sudo chown -R ec2-user:ec2-user "/home/ec2-user/$PROJECT_MAIN_DIR_NAME"

# Create virtual environment
echo "Creating virtual environment..."
virtualenv "/home/ec2-user/$PROJECT_MAIN_DIR_NAME/venv"

# Activate virtual environment
echo "Activating virtual environment..."
source "/home/ec2-user/$PROJECT_MAIN_DIR_NAME/venv/bin/activate"

# Install dependencies
echo "Installing Python dependencies..."
pip install -r "/home/ec2-user/$PROJECT_MAIN_DIR_NAME/restaurant_review/requirements.txt"

echo "Dependencies installed successfully."