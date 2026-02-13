#!/bin/bash

# Install k3s on Ubuntu 22.04
# This script installs a single-node k3s cluster

# Update and upgrade the system
sudo apt-get update -y
sudo apt-get upgrade -y

# Install required dependencies
sudo apt-get install -y curl

# Install k3s
curl -sfL https://get.k3s.io | sh -

# Verify k3s installation
sudo systemctl status k3s

# Display kubeconfig
echo "Kubeconfig is located at /etc/rancher/k3s/k3s.yaml"
echo "You can use it to access the cluster with kubectl"
