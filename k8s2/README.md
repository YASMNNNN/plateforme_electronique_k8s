# Plateforme Électronique - Kubernetes Deployment (ArgoCD Ready)

This directory contains Kubernetes manifests for deploying the Plateforme Électronique application to Minikube using Docker Hub images with the `yassmineg/` prefix.

## Prerequisites

1. **Minikube** installed and running
2. **kubectl** configured to connect to Minikube
3. **ArgoCD** installed (optional, for GitOps deployment)
4. **Docker images** pushed to Docker Hub with tag `yassmineg/`

## Architecture

The platform consists of the following components:

### Infrastructure
- **PostgreSQL** (5 databases: invoice_db, payment_db, subscription_db, notification_db, user_auth_db)
- **Redis** (caching and rate limiting)
- **Keycloak** (IAM/OAuth2 authentication)

### Microservices
- **Eureka Server** (8761) - Service discovery
- **API Gateway** (8080) - Central routing
- **Invoice Service** (8082) - Invoice management
- **Payment Service** (8083) - Payment processing
- **Subscription Service** (8084) - Subscription management
- **Notification Service** (8085) - Email notifications
- **User Auth Service** (8086) - User authentication
- **Signature Service** (8087) - Digital signatures

### Frontend
- **React Frontend** (80) - Web UI

## Quick Start

### Option 1: Direct Deployment with kubectl

```bash
# Start Minikube
minikube start --cpus=4 --memory=8192

# Apply all manifests
kubectl apply -k k8s2/

# Check deployment status
kubectl get all -n plateforme-electronique

# Wait for all pods to be ready
kubectl wait --for=condition=ready pod --all -n plateforme-electronique --timeout=600s
```

### Option 2: Deployment with ArgoCD

1. **Install ArgoCD**:
```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

2. **Access ArgoCD UI**:
```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

3. **Create ArgoCD Application**:
```bash
argocd app create plateforme-electronique \
  --repo https://github.com/<your-repo>/plateforme_electronique_k8s.git \
  --path k8s2 \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace plateforme-electronique \
  --sync-policy automated \
  --auto-prune \
  --self-heal
```

Or use the ArgoCD UI to create the application manually.

## Required Docker Hub Images

Ensure these images are available on Docker Hub:

```
yassmineg/eureka-server:latest
yassmineg/api-gateway:latest
yassmineg/invoice-service:latest
yassmineg/payment-service:latest
yassmineg/subscription-service:latest
yassmineg/notification-service:latest
yassmineg/user-auth-service:latest
yassmineg/signature-service:latest
yassmineg/frontend:latest
```

## Building and Pushing Images

```bash
# Build and push all services
./build-and-push.sh

# Or manually for each service:
docker build -t yassmineg/eureka-server:latest ./services/eureka-server
docker push yassmineg/eureka-server:latest

docker build -t yassmineg/api-gateway:latest ./services/api-gateway
docker push yassmineg/api-gateway:latest

# ... repeat for all services
```

## Configuration

### Secrets

Update the secrets in `secrets.yaml` before deployment:

```yaml
POSTGRES_USER: plateforme_user
POSTGRES_PASSWORD: plateforme_pass  # Change this!
KEYCLOAK_ADMIN: admin
KEYCLOAK_ADMIN_PASSWORD: admin  # Change this!
MAIL_USERNAME: your-email@gmail.com
MAIL_PASSWORD: your-app-password  # Gmail app password
```

**Important**: For production, use Sealed Secrets or external secret management (HashiCorp Vault, AWS Secrets Manager).

### Storage

The manifests use `hostPath` storage for development:
- PostgreSQL: `/data/postgres`
- Redis: `/data/redis`

For production, configure proper PersistentVolumes with cloud storage (AWS EBS, GCP Persistent Disk, etc.).

## Accessing Services

### Get LoadBalancer URLs (Minikube)

```bash
# Get API Gateway URL
minikube service api-gateway -n plateforme-electronique --url

# Get Frontend URL
minikube service frontend -n plateforme-electronique --url

# Or use port forwarding
kubectl port-forward -n plateforme-electronique svc/api-gateway 8080:8080
kubectl port-forward -n plateforme-electronique svc/frontend 3000:80
kubectl port-forward -n plateforme-electronique svc/keycloak 8081:8080
kubectl port-forward -n plateforme-electronique svc/eureka-server 8761:8761
```

### Access Points

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Keycloak Admin**: http://localhost:8081/admin (admin/admin)
- **Eureka Dashboard**: http://localhost:8761

## Monitoring and Troubleshooting

### Check Pod Status

```bash
# All pods
kubectl get pods -n plateforme-electronique

# Specific service
kubectl get pods -n plateforme-electronique -l app=invoice-service

# Pod logs
kubectl logs -n plateforme-electronique -l app=invoice-service --tail=100 -f

# Describe pod
kubectl describe pod -n plateforme-electronique <pod-name>
```

### Check Services

```bash
# All services
kubectl get svc -n plateforme-electronique

# Test internal connectivity
kubectl run -it --rm debug --image=busybox --restart=Never -n plateforme-electronique -- sh
# Inside the pod:
wget -O- http://postgresql:5432
wget -O- http://eureka-server:8761
```

### Check Database Initialization

```bash
# Check PostgreSQL logs
kubectl logs -n plateforme-electronique -l app=postgresql --tail=100

# Connect to PostgreSQL
kubectl exec -it -n plateforme-electronique <postgres-pod-name> -- psql -U plateforme_user -d invoice_db

# List databases
\l

# Verify tables
\dt
```

## Scaling

```bash
# Scale a service
kubectl scale deployment invoice-service -n plateforme-electronique --replicas=3

# Auto-scaling (requires metrics-server)
kubectl autoscale deployment invoice-service -n plateforme-electronique --min=2 --max=5 --cpu-percent=80
```

## Cleanup

```bash
# Delete all resources
kubectl delete -k k8s2/

# Or delete namespace
kubectl delete namespace plateforme-electronique
```

## ArgoCD Application Manifest (Optional)

Create `argocd-application.yaml`:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: plateforme-electronique
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/<your-repo>/plateforme_electronique_k8s.git
    targetRevision: HEAD
    path: k8s2
  destination:
    server: https://kubernetes.default.svc
    namespace: plateforme-electronique
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

Apply it:
```bash
kubectl apply -f argocd-application.yaml
```

## Production Recommendations

1. **Secrets Management**: Use Sealed Secrets or external secret stores
2. **Storage**: Configure cloud-based persistent volumes
3. **Resource Limits**: Add CPU/memory limits and requests
4. **Health Checks**: Tune liveness/readiness probes
5. **Monitoring**: Add Prometheus and Grafana
6. **Ingress**: Configure Ingress controller for external access
7. **TLS**: Enable HTTPS with cert-manager
8. **Backup**: Implement database backup strategy
9. **High Availability**: Run multiple replicas with anti-affinity rules
10. **Network Policies**: Implement network segmentation

## Support

For issues and questions, please refer to the main project documentation or contact the development team.
