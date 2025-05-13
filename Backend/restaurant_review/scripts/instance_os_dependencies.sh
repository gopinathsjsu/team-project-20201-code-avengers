#!/usr/bin/env bash

# Update yum packages
sudo yum update -y

# Install Python 3 and pip
sudo yum install -y python3 python3-pip

# Install virtualenv
sudo pip3 install virtualenv
