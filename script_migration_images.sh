#!/bin/bash

echo "Chargement des images dans Minikube..."

minikube image load plateforme-eureka:latest && echo "✅ eureka"
minikube image load plateforme-frontend:latest && echo "✅ frontend"
minikube image load plateforme-gateway:latest && echo "✅ gateway"
minikube image load plateforme-invoice:latest && echo "✅ invoice"
minikube image load plateforme-notification:latest && echo "✅ notification"
minikube image load plateforme-payment:latest && echo "✅ payment"
minikube image load plateforme-signature:latest && echo "✅ signature"
minikube image load plateforme-subscription:latest && echo "✅ subscription"
minikube image load plateforme-userauth:latest && echo "✅ userauth"

echo ""
echo "✅ Terminé ! Vérification :"
minikube image ls | grep plateforme
