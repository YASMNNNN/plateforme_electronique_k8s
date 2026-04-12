# Plateforme de Facturation Électronique

Application microservices pour la gestion de facturation électronique avec génération PDF/XML, signatures numériques, paiements et notifications.

## Architecture

- **Frontend**: React TypeScript
- **Backend**: Microservices Spring Boot
- **Base de données**: PostgreSQL
- **Authentication**: Keycloak
- **API Gateway**: Spring Cloud Gateway
- **Conteneurisation**: Docker
- **Orchestration**: Kubernetes

## Services

1. **Invoice Service** - Génération de factures PDF et XML UBL
2. **Signature Service** - Service de signature numérique (mock)
3. **Payment Service** - Traitement des paiements (mock CB, D17, QR)
4. **Subscription Service** - Gestion des abonnements annuels
5. **Notification Service** - Envoi de notifications email
6. **User Auth Service** - Service d'authentification avec Keycloak
7. **API Gateway** - Routage et sécurisation des requêtes

## Technologies

- Java 21
- Spring Boot 3.x
- Spring Cloud
- React 18
- TypeScript
- Node.js 20
- PostgreSQL
- Keycloak
- Docker
- Kubernetes

Note: Docker Compose requires the Docker daemon to be running (e.g. `sudo service docker start`).

Note: Some services are placeholders until their source code is added; their Dockerfiles keep containers running for orchestration.

## URLs d'accès

Une fois les services démarrés avec `docker compose up`, vous pouvez accéder aux différents composants via ces URLs :

- **Frontend (Application Web)**: http://localhost:3000
  - Login demo (client-side): `admin@example.com` / `admin123!`
- **API Gateway**: http://localhost:8080
  - Point centralisé pour toutes les APIs REST
  - Documentation OpenAPI: http://localhost:8080/webjars/springfox-swagger-ui/index.html
- **Keycloak (Authentification)**: http://localhost:8081
  - Administration: http://localhost:8081/admin
  - Login admin: `admin` / `admin`
- **Eureka (Service Registry)**: http://localhost:8761
- **Config Server**: http://localhost:8888

## Démarrage rapide

```bash
# Configuration automatique (recommandé)
./setup.sh --auto-start

# Construire tous les services
docker compose build

# Démarrer avec Docker Compose
docker compose up -d
```

Pour le frontend en mode dev, lancez dans un autre terminal :

```bash
cd frontend
npm start
```

Pour le frontend en mode prod :

```bash
cd frontend
npm run build
```

Puis (si vous utilisez Docker) :

```bash
docker compose up -d --build frontend
```

## Next steps (pour relancer proprement)

1. Rebuild des services gateway/eureka/invoice/payment:

```bash
docker compose up -d --build api-gateway eureka-server invoice-service payment-service
```

2. Si les bases n’existent toujours pas (init script ne s’exécute qu’au 1er démarrage du volume):

```bash
docker exec -it plateforme-db psql -U plateforme_user -c "CREATE DATABASE invoice_db;"
docker exec -it plateforme-db psql -U plateforme_user -c "CREATE DATABASE payment_db;"
```

3. Vérifier l’inscription Eureka: http://localhost:8761

## Scaler des conteneurs Docker sans Kubernetes

Il existe plusieurs méthodes pour scaler sans orchestrateur complexe.

1. Docker Compose (le plus simple)

```bash
# Scaler un service à 3 instances
docker-compose up -d --scale invoice-service=3

# Scaler plusieurs services
docker-compose up -d --scale invoice-service=3 --scale payment-service=2
```

## Développement

Chaque service est indépendant et peut être développé séparément :

```bash
# Aller dans le répertoire d'un service
cd services/invoice-service

# Construire et exécuter
mvn spring-boot:run
```

Etat actuel

- Frontend React minimal avec page `/login` et auth demo client-side.
- invoice-service est buildable; les autres services sont des placeholders.
  ┌────────────────────────┬──────────────┬───────┐
  │         Email          │ Mot de passe │ Rôle  │
  ├────────────────────────┼──────────────┼───────┤
  │ admin@example.com      │ admin1234    │ ADMIN │
  ├────────────────────────┼──────────────┼───────┤
  │ yasminegr432@gmail.com │ yassmine123  │ ADMIN │
  ├────────────────────────┼──────────────┼───────┤
  │ user@example.com       │ user1234     │ USER  │
  └────────────────────────┴──────────────┴───────┘
