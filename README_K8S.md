# Plateforme de Paiement Électronique - Guide Kubernetes

## 📋 Table des matières

- [Gestion de Minikube](#gestion-de-minikube)
- [Déploiement des pods](#déploiement-des-pods)
- [Commandes de vérification](#commandes-de-vérification)
- [Gestion des pods](#gestion-des-pods)
- [Accès aux services](#accès-aux-services)
- [Dépannage](#dépannage)

---

## 🚀 Gestion de Minikube

### Arrêter Minikube proprement

```bash
minikube stop
```

Cette commande arrête tous les pods automatiquement, sauvegarde l'état du cluster et libère les ressources (CPU, RAM).

### Démarrer Minikube

```bash
minikube start
```

### Activer le provisionneur de stockage

```bash
minikube addons enable storage-provisioner
```

### Autres commandes Minikube

| Action | Commande |
|--------|----------|
| Arrêter | `minikube stop` |
| Démarrer | `minikube start` |
| Voir le statut | `minikube status` |
| Accéder au dashboard | `minikube dashboard` |
| Supprimer complètement | `minikube delete` |

---

## 📦 Déploiement des pods

### Option 1 : Tout déployer en une seule commande

```bash
kubectl apply -f ~/plateforme_electronique/k8s/ --recursive
```

### Option 2 : Déployer service par service

```bash
# Namespace (si vous en avez un)
kubectl apply -f ~/plateforme_electronique/k8s/namespace.yaml

# Base de données
kubectl apply -f ~/plateforme_electronique/k8s/postgres/
kubectl apply -f ~/plateforme_electronique/k8s/redis/

# Infrastructure
kubectl apply -f ~/plateforme_electronique/k8s/keycloak/
kubectl apply -f ~/plateforme_electronique/k8s/eureka/

# Services métier
kubectl apply -f ~/plateforme_electronique/k8s/api-gateway/
kubectl apply -f ~/plateforme_electronique/k8s/user-auth/
kubectl apply -f ~/plateforme_electronique/k8s/payment/
kubectl apply -f ~/plateforme_electronique/k8s/invoice/
kubectl apply -f ~/plateforme_electronique/k8s/subscription/
kubectl apply -f ~/plateforme_electronique/k8s/notification/
kubectl apply -f ~/plateforme_electronique/k8s/signature/

# Frontend
kubectl apply -f ~/plateforme_electronique/k8s/frontend/
```

---

## ✅ Commandes de vérification

| Action | Commande |
|--------|----------|
| Voir tous les pods | `kubectl get pods` |
| Voir les pods en temps réel | `kubectl get pods -w` |
| Voir tous les pods (tous namespaces) | `kubectl get pods -A` |
| Voir les services et leurs ports | `kubectl get svc` |
| Voir les déploiements | `kubectl get deployments` |
| Voir tout | `kubectl get all` |

---

## 🔄 Gestion des pods

### Redémarrer un déploiement

```bash
kubectl rollout restart deployment <nom-du-deployment>
```

Exemples :

```bash
kubectl rollout restart deployment frontend
kubectl rollout restart deployment api-gateway
kubectl rollout restart deployment payment-service
```

### Supprimer un pod (il sera recréé automatiquement)

```bash
kubectl delete pod <nom-du-pod>
```

### Supprimer tous les pods

```bash
kubectl delete pods --all
```

### Supprimer tous les déploiements

```bash
kubectl delete deployments --all
```

---

## 🌐 Accès aux services

### Obtenir l'URL du frontend

```bash
minikube service frontend --url
```

### Obtenir l'URL d'un service spécifique

```bash
minikube service <nom-du-service> --url
```

### Liste des services exposés

| Service | Port interne | Commande pour obtenir l'URL |
|---------|--------------|----------------------------|
| Frontend | 80 | `minikube service frontend --url` |
| API Gateway | 8080 | `minikube service api-gateway --url` |
| Eureka | 8761 | `minikube service eureka --url` |
| Keycloak | 8080 | `minikube service keycloak --url` |

---

## 🔧 Dépannage

### Voir les logs d'un pod

```bash
kubectl logs <nom-du-pod>
```

### Voir les logs en temps réel

```bash
kubectl logs -f <nom-du-pod>
```

### Voir les logs d'un déploiement

```bash
kubectl logs -l app=frontend
kubectl logs -l app=api-gateway
```

### Accéder au shell d'un pod

```bash
kubectl exec -it <nom-du-pod> -- /bin/sh
```

### Décrire un pod (pour voir les erreurs)

```bash
kubectl describe pod <nom-du-pod>
```

### Vérifier les événements du cluster

```bash
kubectl get events --sort-by='.lastTimestamp'
```

---

## 📊 Architecture des services

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                    (Nginx - port 80)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY                             │
│                    (Spring - port 8080)                      │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  User Auth    │   │   Payment     │   │   Invoice     │
│  Service      │   │   Service     │   │   Service     │
└───────────────┘   └───────────────┘   └───────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Subscription  │   │ Notification  │   │  Signature    │
│  Service      │   │   Service     │   │   Service     │
└───────────────┘   └───────────────┘   └───────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  PostgreSQL   │   │    Redis      │   │   Keycloak    │
│  (port 5432)  │   │  (port 6379)  │   │  (port 8080)  │
└───────────────┘   └───────────────┘   └───────────────┘
```

---

## 🔁 Workflow complet

### Démarrage complet

```bash
# 1. Démarrer Minikube
minikube start

# 2. Configurer Docker pour utiliser Minikube (si rebuild nécessaire)
eval $(minikube docker-env)

# 3. Déployer tous les services
kubectl apply -f ~/plateforme_electronique/k8s/ --recursive

# 4. Vérifier que tout est en cours d'exécution
kubectl get pods -w

# 5. Obtenir l'URL du frontend
minikube service frontend --url
```

### Arrêt complet

```bash
# Arrêter Minikube (arrête tous les pods)
minikube stop
```

---

## 📝 Notes importantes

1. **Persistence des données** : Les données PostgreSQL et Redis sont stockées dans des PersistentVolumes. Elles survivent aux redémarrages de pods mais pas à `minikube delete`.

2. **Images Docker** : Si vous modifiez le code, reconstruisez les images dans le contexte Minikube :
   ```bash
   eval $(minikube docker-env)
   docker build -t <nom-image>:latest <chemin>
   kubectl rollout restart deployment <nom>
   ```

3. **Ressources** : Minikube utilise les ressources de votre machine. Ajustez si nécessaire :
   ```bash
   minikube start --cpus=2 --memory=3072
   ```
### ou bien simplement

   ```bash
   minikube start --driver=docker
   ```
---

*Documentation générée pour la Plateforme de Paiement Électronique*
