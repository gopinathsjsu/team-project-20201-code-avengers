#!/bin/bash
set -e

# Replace {YOUR_GIT_REOPO_URL} with your actual Git repository URL
# GIT_REPO_URL="https://github.com/gopinathsjsu/team-project-cmpe-2020-02-spartans.git"
GIT_REPO_URL="https://siddharthck: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@github.com/gopinathsjsu/team-project-cmpe-2020-02-spartans.git"

# Replace {YOUR_PROJECT_MAIN_DIR_NAME} with your actual project directory name
PROJECT_MAIN_DIR_NAME="team-project-cmpe-2020-02-spartans"

# Clone repository
git clone "$GIT_REPO_URL" "/home/ubuntu/$PROJECT_MAIN_DIR_NAME"

cd "/home/ubuntu/$PROJECT_MAIN_DIR_NAME/Backend/restaurant_review"

# Make all .sh files executable
chmod +x scripts/*.sh

# Execute scripts for OS dependencies, Python dependencies, Gunicorn, Nginx, and starting the application
./scripts/instance_os_dependencies.sh
./scripts/python_dependencies.sh
./scripts/gunicorn.sh
./scripts/start_app.sh