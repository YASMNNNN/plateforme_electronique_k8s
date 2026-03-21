
#Lancement: docker compose -f docker-compose.monitoring.yml up -d

# Stack de Monitoring — Plateforme Electronique Microservices

> **Yesmine GRASSA — ISET KAIROUAN**  
> Stack : Prometheus · cAdvisor · Node Exporter · Loki · Promtail · Grafana · Alertmanager

---

## Structure des fichiers

```
projet/
├── docker-compose.monitoring.yml       ← fichier principal à lancer
└── monitoring/
    ├── prometheus/
    │   ├── prometheus.yml              ← config scrape + alertmanager
    │   └── rules/
    │       └── alerts.yml             ← règles d'alerte
    ├── loki/
    │   └── loki-config.yml            ← config stockage logs
    ├── promtail/
    │   └── promtail-config.yml        ← collecte logs containers
    ├── alertmanager/
    │   └── alertmanager.yml           ← routage Email / Slack
    └── grafana/
        └── provisioning/
            ├── datasources/
            │   └── datasources.yml    ← Prometheus + Loki auto-configurés
            └── dashboards/
                └── dashboards.yml     ← chargement dashboards automatique
```

---

## URLs d'accès

| Service | URL | Identifiants | Usage |
|---|---|---|---|
| **Grafana** | http://localhost:**3001** | admin / admin123 | Dashboards, logs, alertes — **interface principale** |
| **Prometheus** | http://localhost:9090 | — | Requêtes PromQL, vérif targets |
| **Alertmanager** | http://localhost:9093 | — | Alertes actives, silences |
| **cAdvisor** | http://localhost:8080 | — | Métriques containers brutes |
| **Node Exporter** | http://localhost:9100/metrics | — | Métriques hôte brutes |
| **Loki** | http://localhost:3100/ready | — | Healthcheck du service logs |

> **Sur WSL2 / Rancher Desktop (DESKTOP-MF5MQUL)** : les ports sont automatiquement forwardés vers Windows, accès direct depuis le navigateur Windows avec `localhost`.  
> **Sur serveur distant** : remplacer `localhost` par l'IP du serveur, ex. `http://192.168.1.50:3001`

---

## Démarrage

### Prérequis

Vérifier que le réseau de la plateforme applicative existe :
```bash
docker network ls | grep plateforme-electronique
```

Si le nom est différent, l'adapter dans `docker-compose.monitoring.yml` :
```yaml
app-network:
  external: true
  name: plateforme-electronique_default   # ← changer ici
```

### Lancer la stack

```bash
docker compose -f docker-compose.monitoring.yml up -d
```

### Vérifier que tout tourne

```bash
docker compose -f docker-compose.monitoring.yml ps
```

Résultat attendu — tous les services doivent être `running` :

```
NAME             STATUS
prometheus       running
cadvisor         running
node-exporter    running
loki             running
promtail         running
alertmanager     running
grafana          running
```

### Voir les logs d'un service

```bash
docker logs grafana -f
docker logs prometheus -f
docker logs loki -f
```

### Arrêter la stack

```bash
# Arrêt simple (données conservées)
docker compose -f docker-compose.monitoring.yml down

# Arrêt + suppression des volumes (données perdues)
docker compose -f docker-compose.monitoring.yml down -v
```

---

## Configuration des microservices Spring Boot

Chaque microservice doit exposer ses métriques pour que Prometheus puisse les collecter.

### 1. Dépendances Maven (`pom.xml`)

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

### 2. Configuration (`application.yml`)

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus,metrics
  endpoint:
    prometheus:
      enabled: true
  metrics:
    tags:
      application: ${spring.application.name}
```

### 3. Déclarer le service dans Prometheus

Ajouter un bloc dans `monitoring/prometheus/prometheus.yml` :

```yaml
- job_name: "mon-nouveau-service"
  metrics_path: /actuator/prometheus
  static_configs:
    - targets: ["nom-container:port"]
```

Recharger Prometheus sans redémarrage :
```bash
curl -X POST http://localhost:9090/-/reload
```

---

## Grafana — Premiers pas

### Connexion

Ouvrir http://localhost:3001 → login `admin` / `admin123`

### Importer les dashboards communautaires

Menu gauche → **Dashboards** → **Import** → saisir l'ID → **Load**

| ID | Dashboard | Utilité |
|---|---|---|
| `15798` | Docker containers (cAdvisor) | CPU/RAM/réseau par container |
| `1860` | Node Exporter Full | Machine hôte complète |
| `17175` | Spring Boot Microservices | Métriques applicatives JVM |
| `13659` | Loki logs dashboard | Exploration des logs |

Sélectionner la datasource **Prometheus** (ou **Loki** pour le dashboard logs) quand demandé.

### Explorer les logs (Loki)

Menu gauche → **Explore** → sélectionner la source **Loki** → dans le filtre :
```
{container="nom-de-ton-container"}
```

Exemples :
```
{container="api-gateway"}
{container="payment-service"} |= "ERROR"
{service="auth-service"} | json | level="ERROR"
```

### Requêtes PromQL utiles (Prometheus / Grafana)

```promql
# CPU d'un container (%)
rate(container_cpu_usage_seconds_total{name="api-gateway"}[2m]) * 100

# RAM utilisée par container (Mo)
container_memory_usage_bytes{name="payment-service"} / 1024 / 1024

# Taux de requêtes HTTP par service
rate(http_server_requests_seconds_count{application="api-gateway"}[1m])

# Latence P95 d'un service Spring Boot
histogram_quantile(0.95, rate(http_server_requests_seconds_bucket{application="payment-service"}[2m]))

# CPU hôte global (%)
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100)

# RAM hôte disponible (Go)
node_memory_MemAvailable_bytes / 1024 / 1024 / 1024
```

---

## Alertmanager — Configuration des notifications

Éditer `monitoring/alertmanager/alertmanager.yml` et remplacer :

```yaml
# Slack
api_url: "<TON_SLACK_WEBHOOK_URL>"
channel: "#monitoring-plateforme"

# Email
smtp_from: "<ton-email@gmail.com>"
smtp_auth_username: "<ton-email@gmail.com>"
smtp_auth_password: "<mot-de-passe-application-gmail>"
to: "<ton-email@iset.tn>"
```

Redémarrer Alertmanager après modification :
```bash
docker restart alertmanager
```

Vérifier la config sur http://localhost:9093

---

## Alertes pré-configurées

Les règles sont dans `monitoring/prometheus/rules/alerts.yml` :

| Alerte | Seuil | Sévérité |
|---|---|---|
| `ContainerDown` | Container absent > 1 min | critical |
| `ContainerHighCPU` | CPU container > 80% pendant 2 min | warning |
| `ContainerHighMemory` | RAM container > 85% de la limite | warning |
| `HostHighCPU` | CPU hôte > 85% pendant 5 min | warning |
| `HostLowDisk` | Disque disponible < 15% | critical |
| `HostHighMemory` | RAM hôte > 90% | critical |
| `ServiceHighErrorRate` | Erreurs 5xx > 5% | critical |
| `ServiceHighLatency` | Latence P95 > 2 secondes | warning |

Vérifier l'état des alertes sur http://localhost:9090/alerts

---

## Dépannage

### Un service ne démarre pas

```bash
docker logs <nom-service> --tail 50
```

### Prometheus ne trouve pas un target

Ouvrir http://localhost:9090/targets — vérifier que le service est `UP`.  
Causes fréquentes : mauvais nom de container, port incorrect, réseau différent.

### Grafana ne reçoit pas de données

Ouvrir http://localhost:3001 → Menu → **Connections** → **Data sources** → tester chaque source.

### Loki ne reçoit pas de logs

```bash
docker logs promtail --tail 30
# Vérifier que /var/run/docker.sock est accessible
```

### Forcer le rechargement de la config Prometheus

```bash
curl -X POST http://localhost:9090/-/reload
```

---

## Versions utilisées

| Image | Version |
|---|---|
| `prom/prometheus` | v2.51.2 |
| `prom/node-exporter` | v1.8.1 |
| `prom/alertmanager` | v0.27.0 |
| `gcr.io/cadvisor/cadvisor` | v0.49.1 |
| `grafana/grafana` | 10.4.2 |
| `grafana/loki` | 2.9.7 |
| `grafana/promtail` | 2.9.7 |
