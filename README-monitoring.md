# Stack de Monitoring — Plateforme Electronique Microservices

## Structure des fichiers

```
monitoring/
├── docker-compose.monitoring.yml
└── monitoring/
    ├── prometheus/
    │   ├── prometheus.yml
    │   └── rules/
    │       └── alerts.yml
    ├── loki/
    │   └── loki-config.yml
    ├── promtail/
    │   └── promtail-config.yml
    ├── alertmanager/
    │   └── alertmanager.yml
    └── grafana/
        └── provisioning/
            ├── datasources/
            │   └── datasources.yml
            └── dashboards/
                └── dashboards.yml
```

---

## Démarrage rapide

```bash
# 1. Vérifier que le réseau de ta plateforme existe
docker network inspect plateforme-electronique_default

# 2. Lancer la stack de monitoring
docker compose -f docker-compose.monitoring.yml up -d

# 3. Vérifier que tout tourne
docker compose -f docker-compose.monitoring.yml ps
```

Accès aux interfaces :
| Service       | URL                        |
|---------------|----------------------------|
| Grafana       | http://localhost:3000       |
| Prometheus    | http://localhost:9090       |
| Alertmanager  | http://localhost:9093       |
| cAdvisor      | http://localhost:8080       |
| Node Exporter | http://localhost:9100       |
| Loki          | http://localhost:3100       |

---

## Configuration du réseau

Dans `docker-compose.monitoring.yml`, adapter le nom du réseau externe :
```yaml
app-network:
  external: true
  name: plateforme-electronique_default  # docker network ls pour vérifier
```

---

## Exposition des métriques Spring Boot

Ajouter dans chaque microservice `pom.xml` :

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

Dans `application.yml` de chaque service :

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

---

## Dashboards Grafana recommandés

Importer depuis grafana.com (Menu → Dashboards → Import) :
- **15798** — Docker containers (cAdvisor)
- **1860**  — Node Exporter Full
- **13659** — Loki logs dashboard
- **17175** — Spring Boot Microservices

---

## Arrêt de la stack

```bash
docker compose -f docker-compose.monitoring.yml down

# Supprimer aussi les volumes (données perdues)
docker compose -f docker-compose.monitoring.yml down -v
```
