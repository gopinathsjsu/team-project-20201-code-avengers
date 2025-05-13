#!/usr/bin/bash

# Replace {YOUR_PROJECT_MAIN_DIR_NAME} with your actual project directory name
PROJECT_MAIN_DIR_NAME="team-project-20201-code-avengers"

# Copy gunicorn  service file
sudo cp "/home/ec2-user/$PROJECT_MAIN_DIR_NAME/Backend/restaurant_review/gunicorn/gunicorn.service" "/etc/systemd/system/gunicorn.service"

# Start and enable Gunicorn service
sudo systemctl start gunicorn.service
sudo systemctl enable gunicorn.service