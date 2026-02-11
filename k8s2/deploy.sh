#!/bin/bash

# Quick deployment script for Minikube
# Usage: ./deploy.sh

set -e

echo "=========================================="
echo "Deploying Plateforme Électronique to Minikube"
echo "=========================================="

# Check if Minikube is running
if ! minikube status > /dev/null 2>&1; then
    echo "Starting Minikube..."
    minikube start --cpus=4 --memory=8192 --driver=docker
else
    echo "✓ Minikube is running"
fi

# Apply Kubernetes manifests
echo ""
echo "Applying Kubernetes manifests..."
kubectl apply -k k8s2/

echo ""
echo "Waiting for pods to be ready..."
echo "(This may take several minutes on first deployment)"

# Wait for PostgreSQL to be ready first
echo ""
echo "Waiting for PostgreSQL..."
kubectl wait --for=condition=ready pod -l app=postgresql -n plateforme-electronique --timeout=300s

# Wait for Redis
echo "Waiting for Redis..."
kubectl wait --for=condition=ready pod -l app=redis -n plateforme-electronique --timeout=300s

# Wait for Keycloak
echo "Waiting for Keycloak..."
kubectl wait --for=condition=ready pod -l app=keycloak -n plateforme-electronique --timeout=300s

# Wait for Eureka
echo "Waiting for Eureka Server..."
kubectl wait --for=condition=ready pod -l app=eureka-server -n plateforme-electronique --timeout=300s

# Wait for all other services
echo "Waiting for all services..."
kubectl wait --for=condition=ready pod --all -n plateforme-electronique --timeout=600s

echo ""
echo "=========================================="
echo "Deployment completed successfully!"
echo "=========================================="

# Display access information
echo ""
echo "Access URLs (use 'minikube service' or port-forward):"
echo ""
echo "API Gateway:"
echo "  minikube service api-gateway -n plateforme-electronique --url"
echo "  OR: kubectl port-forward -n plateforme-electronique svc/api-gateway 8080:8080"
echo ""
echo "Frontend:"
echo "  minikube service frontend -n plateforme-electronique --url"
echo "  OR: kubectl port-forward -n plateforme-electronique svc/frontend 3000:80"
echo ""
echo "Keycloak Admin Console:"
echo "  kubectl port-forward -n plateforme-electronique svc/keycloak 8081:8080"
echo "  URL: http://localhost:8081/admin"
echo "  Credentials: admin/admin"
echo ""
echo "Eureka Dashboard:"
echo "  kubectl port-forward -n plateforme-electronique svc/eureka-server 8761:8761"
echo "  URL: http://localhost:8761"
echo ""
echo "Check status:"
echo "  kubectl get all -n plateforme-electronique"
echo ""
