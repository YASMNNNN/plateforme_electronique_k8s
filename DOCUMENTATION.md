# Documentation Technique - Plateforme de Facturation Electronique

## Table des matieres

1. [Presentation du projet](#1-presentation-du-projet)
2. [Architecture globale](#2-architecture-globale)
3. [Stack technique](#3-stack-technique)
4. [Services backend](#4-services-backend)
5. [Frontend](#5-frontend)
6. [Base de donnees](#6-base-de-donnees)
7. [API Reference](#7-api-reference)
8. [Cycle de vie d'une facture](#8-cycle-de-vie-dune-facture)
9. [Generation PDF](#9-generation-pdf)
10. [Authentification](#10-authentification)
11. [Infrastructure et deploiement](#11-infrastructure-et-deploiement)
12. [Guide de demarrage](#12-guide-de-demarrage)
13. [Scaling](#13-scaling)
14. [Structure du projet](#14-structure-du-projet)
15. [Corrections et changements](#15-corrections-et-changements)

---

## 1. Presentation du projet

La **Plateforme de Facturation Electronique** est une application microservices destinee a la gestion complete du cycle de facturation : creation, validation, envoi, paiement, annulation et suppression de factures. Elle integre la generation de PDF professionnels, la gestion des abonnements, les paiements, les notifications par email et l'authentification via Keycloak.

### Fonctionnalites principales

- Creation et gestion de factures (brouillon, validation, envoi, paiement, annulation)
- Generation de PDF professionnels avec informations client (iText7)
- Suppression des factures brouillon et annulees
- Tableau de bord avec statistiques (revenus, factures payees, envoyees, brouillons)
- Gestion des clients
- Gestion des paiements (carte bancaire, virement, especes, cheque)
- Gestion des abonnements (Free, Basic, Premium, Enterprise)
- Notifications par email
- Gestion de profil utilisateur
- Authentification securisee (Keycloak + JWT)

---

## 2. Architecture globale

L'application suit une architecture **microservices** avec un API Gateway central, un service de decouverte (Eureka), et des services metier independants.

```
                          +-------------------+
                          |    Frontend       |
                          |  React/TypeScript |
                          |    :3000          |
                          +--------+----------+
                                   |
                          +--------v----------+
                          |   API Gateway     |
                          | Spring Cloud GW   |
                          |    :8080          |
                          +--------+----------+
                                   |
              +--------------------+--------------------+
              |                    |                     |
    +---------v------+  +---------v------+  +-----------v--------+
    | Invoice Service|  |Payment Service |  |Subscription Service|
    |    :8082       |  |    :8080       |  |     :8083          |
    +-------+--------+  +-------+--------+  +--------+----------+
            |                    |                     |
    +-------v--------+  +-------v--------+  +---------v---------+
    |  invoice_db    |  |  payment_db    |  | subscription_db   |
    +----------------+  +----------------+  +-------------------+

    +-------------------+  +-------------------+  +-------------------+
    | Notification Svc  |  | User Auth Service |  | Signature Service |
    |     :8085         |  |     :8081         |  |     :8080         |
    +--------+----------+  +--------+----------+  +-------------------+
             |                      |
    +--------v----------+  +--------v----------+
    | notification_db   |  |  user_auth_db     |
    +-------------------+  +-------------------+

    +-------------------+  +-------------------+
    |  Eureka Server    |  |    Keycloak       |
    |    :8761          |  |    :8081          |
    +-------------------+  +-------------------+

    +-------------------+  +-------------------+
    |   PostgreSQL      |  |     Redis         |
    |    :5432          |  |    :6379          |
    +-------------------+  +-------------------+
```

### Flux de communication

1. Le **Frontend** envoie toutes les requetes a l'**API Gateway** (`http://localhost:8080`)
2. L'**API Gateway** consulte **Eureka** pour localiser les services et route les requetes
3. Chaque service a sa propre **base de donnees PostgreSQL** (isolation des donnees)
4. **Redis** est utilise pour le cache et le rate limiting au niveau du Gateway
5. **Keycloak** gere l'authentification et l'emission de tokens JWT

---

## 3. Stack technique

| Composant        | Technologie                        | Version  |
|------------------|------------------------------------|----------|
| Langage backend  | Java                               | 21       |
| Framework backend| Spring Boot                        | 3.2.0    |
| Cloud framework  | Spring Cloud                       | 2023.0.0 |
| Service discovery| Netflix Eureka                     | -        |
| API Gateway      | Spring Cloud Gateway               | -        |
| Frontend         | React                              | 18.2.0   |
| Langage frontend | TypeScript                         | 4.9.5    |
| CSS              | Tailwind CSS                       | 3.4.3    |
| Routage frontend | React Router                       | 6.22.3   |
| Base de donnees  | PostgreSQL                         | 15       |
| Cache            | Redis                              | 7        |
| Authentification | Keycloak                           | 22.0     |
| Generation PDF   | iText7 + html2pdf                  | 8.0.2    |
| ORM              | Hibernate (Spring Data JPA)        | 6.3.1    |
| Build backend    | Maven                              | 3.9.9    |
| Build frontend   | Node.js / npm                      | 20       |
| Conteneurisation | Docker + Docker Compose            | -        |
| Orchestration    | Kubernetes (K3s)                   | -        |
| Documentation API| SpringDoc OpenAPI (Swagger)        | 2.3.0    |

---

## 4. Services backend

### 4.1 API Gateway (`api-gateway`)

| Propriete     | Valeur                                 |
|---------------|----------------------------------------|
| Port          | 8080                                   |
| Profil Spring | docker                                 |
| Dependances   | Eureka Client, Redis                   |

**Routes configurees :**

| Route                           | Service cible         |
|---------------------------------|-----------------------|
| `/api/auth/**`                  | user-auth-service     |
| `/api/users/**`                 | user-auth-service     |
| `/api/merchants/**`             | user-auth-service     |
| `/api/invoices/**`              | invoice-service       |
| `/api/clients/**`               | invoice-service       |
| `/api/payments/**`              | payment-service       |
| `/api/cards/**`                 | payment-service       |
| `/api/subscriptions/**`         | subscription-service  |
| `/api/plans/**`                 | subscription-service  |
| `/api/notifications/**`         | notification-service  |

**CORS :** Origines autorisees `http://localhost:3000` et `http://localhost:3001`.

---

### 4.2 Invoice Service (`invoice-service`)

| Propriete     | Valeur                                 |
|---------------|----------------------------------------|
| Port          | 8082                                   |
| Base de donnees| invoice_db                            |
| Nom Eureka    | INVOICE-SERVICE                        |

Service principal de la plateforme. Gere le cycle de vie complet des factures.

**Entites :**

**Invoice** (`invoices`)

| Champ           | Type          | Description                        |
|-----------------|---------------|------------------------------------|
| id              | UUID          | Identifiant unique (auto-genere)   |
| invoiceNumber   | VARCHAR(30)   | Numero de facture (FAC-YYYY-XXXXX) |
| ownerUserId     | UUID          | ID du proprietaire/marchand        |
| clientName      | VARCHAR(255)  | Nom du client                      |
| clientEmail     | VARCHAR(255)  | Email du client                    |
| billingAddress  | VARCHAR(500)  | Adresse de facturation             |
| subtotalHt      | DECIMAL(15,4) | Montant hors taxe                  |
| vatRate         | DECIMAL(5,2)  | Taux TVA (defaut: 19%)             |
| vatAmount       | DECIMAL(15,4) | Montant TVA                        |
| totalTtc        | DECIMAL(15,4) | Montant toutes taxes comprises     |
| status          | ENUM          | DRAFT, VALIDATED, SENT, PAID, CANCELLED |
| issueDate       | DATE          | Date d'emission                    |
| dueDate         | DATE          | Date d'echeance                    |
| signatureHash   | VARCHAR(255)  | Hash de signature numerique        |
| createdAt       | TIMESTAMP     | Date de creation                   |
| updatedAt       | TIMESTAMP     | Date de derniere modification      |

**InvoiceItem** (`invoice_items`)

| Champ       | Type          | Description                     |
|-------------|---------------|---------------------------------|
| id          | UUID          | Identifiant unique              |
| invoice_id  | UUID          | Reference vers la facture (FK)  |
| description | VARCHAR(500)  | Description de la ligne         |
| quantity    | DECIMAL(10,3) | Quantite                        |
| unitPrice   | DECIMAL(15,4) | Prix unitaire                   |
| taxRate     | DECIMAL(5,2)  | Taux de taxe (defaut: 19%)      |
| lineTotalHt | DECIMAL(15,4) | Total HT de la ligne            |

**Product** (`products`)

| Champ       | Type          | Description                     |
|-------------|---------------|---------------------------------|
| id          | BIGINT        | Identifiant unique              |
| sku         | VARCHAR(50)   | Code article unique             |
| name        | VARCHAR(200)  | Nom du produit                  |
| description | VARCHAR(1000) | Description                     |
| category    | VARCHAR(50)   | Categorie                       |
| unitPrice   | DECIMAL(15,4) | Prix unitaire                   |
| currency    | VARCHAR(10)   | Devise (defaut: EUR)            |
| taxRate     | DECIMAL(7,2)  | Taux de taxe (defaut: 20%)      |
| unit        | VARCHAR(10)   | Unite (defaut: PCS)             |
| tenantId    | BIGINT        | ID du tenant                    |
| active      | BOOLEAN       | Actif (defaut: true)            |

---

### 4.3 Payment Service (`payment-service`)

| Propriete     | Valeur                                 |
|---------------|----------------------------------------|
| Port          | 8080                                   |
| Base de donnees| payment_db                            |
| Nom Eureka    | PAYMENT-SERVICE                        |

Gere les paiements et les cartes bancaires.

**Methodes de paiement :** CARD, BANK_TRANSFER, CASH, CHECK

**Statuts de paiement :** PENDING, COMPLETED, FAILED, REFUNDED

---

### 4.4 Subscription Service (`subscription-service`)

| Propriete     | Valeur                                 |
|---------------|----------------------------------------|
| Port          | 8083                                   |
| Base de donnees| subscription_db                       |
| Nom Eureka    | SUBSCRIPTION-SERVICE                   |

Gere les abonnements des utilisateurs.

**Plans disponibles :**

| Plan       | Description                                 |
|------------|---------------------------------------------|
| FREE       | Plan gratuit avec fonctionnalites limitees   |
| BASIC      | Plan basique                                |
| PREMIUM    | Plan premium avec fonctionnalites avancees   |
| ENTERPRISE | Plan entreprise complet                     |

**Statuts d'abonnement :** ACTIVE, CANCELLED, EXPIRED, SUSPENDED

---

### 4.5 Notification Service (`notification-service`)

| Propriete     | Valeur                                 |
|---------------|----------------------------------------|
| Port          | 8085                                   |
| Base de donnees| notification_db                       |
| Nom Eureka    | NOTIFICATION-SERVICE                   |
| Email SMTP   | Gmail (configurable)                    |

Gere l'envoi de notifications par email et les preferences utilisateur.

**Types de notification :** INFO, PAYMENT, INVOICE, SYSTEM

---

### 4.6 User Auth Service (`user-auth-service`)

| Propriete     | Valeur                                 |
|---------------|----------------------------------------|
| Port          | 8081                                   |
| Base de donnees| user_auth_db                          |
| Nom Eureka    | USER-AUTH-SERVICE                      |
| JWT Secret   | Configurable via env                    |

Gere l'authentification, les profils utilisateurs et l'integration Keycloak.

---

### 4.7 Signature Service (`signature-service`)

| Propriete     | Valeur                                 |
|---------------|----------------------------------------|
| Port          | 8080                                   |
| Statut        | Placeholder (conteneur en attente)     |

Service de signature numerique (a implementer).

---

### 4.8 Eureka Server (`eureka-server`)

| Propriete     | Valeur                                 |
|---------------|----------------------------------------|
| Port          | 8761                                   |
| Interface     | http://localhost:8761                   |

Service de decouverte. Tous les microservices s'enregistrent aupres d'Eureka au demarrage.

---

## 5. Frontend

### 5.1 Technologies

- **React 18** avec **TypeScript**
- **Tailwind CSS** pour le styling
- **React Router v6** pour le routage
- **Nginx** pour le serveur de production (Docker)

### 5.2 Pages et routes

| Route                        | Composant       | Description                        |
|------------------------------|------------------|------------------------------------|
| `/login`                     | Login            | Page de connexion                  |
| `/admin`                     | Dashboard        | Tableau de bord avec statistiques  |
| `/admin/invoices`            | Invoices         | Liste des factures (pagination, filtres, recherche) |
| `/admin/invoices/new`        | InvoiceCreate    | Formulaire de creation de facture  |
| `/admin/invoices/:id`        | InvoiceDetail    | Detail d'une facture avec actions  |
| `/admin/invoices/:id/edit`   | InvoiceEdit      | Modification d'un brouillon       |
| `/admin/clients`             | Clients          | Gestion des clients                |
| `/admin/payments`            | Payments         | Suivi des paiements                |
| `/admin/profile`             | Profile          | Profil utilisateur                 |
| `/admin/subscriptions`       | Subscriptions    | Gestion des abonnements            |
| `/admin/cards`               | Cards            | Gestion des cartes de paiement     |
| `/admin/settings`            | Settings         | Parametres de l'application        |

### 5.3 Couche API (`frontend/src/api/`)

**`gateway.ts`** - Client API centralise avec helper `apiFetch` qui gere :
- Injection automatique du token JWT (`Authorization: Bearer ...`)
- Serialisation/deserialisation JSON
- Gestion des erreurs HTTP

**`types.ts`** - Types TypeScript pour toutes les entites :
- `Invoice`, `InvoiceItem`, `InvoiceStatus`, `InvoicePayload`, `InvoicePage`
- `Payment`, `PaymentStatus`
- `UserProfile`, `UpdateUserPayload`, `UserPage`
- `Card`, `CardPayload`
- `Subscription`, `CreateSubscriptionPayload`, `Plan`
- `Notification`, `NotificationPreferences`
- `MerchantInvoiceStats`

### 5.4 Fonctionnalites de la page Factures

- **Listing** avec pagination (10 factures/page)
- **Filtrage** par statut (Tous, Brouillon, Validee, Envoyee, Payee, Annulee)
- **Recherche** par nom client, email ou numero de facture
- **Actions contextuelles** selon le statut :

| Statut    | Actions disponibles                          |
|-----------|----------------------------------------------|
| DRAFT     | Voir, Modifier, Valider, Supprimer           |
| VALIDATED | Voir, Envoyer, Annuler                       |
| SENT      | Voir, PDF, Annuler                           |
| PAID      | Voir, PDF                                    |
| CANCELLED | Voir, Supprimer                              |

- **Modales de confirmation** pour les actions destructives (suppression, annulation)

---

## 6. Base de donnees

### 6.1 Configuration

| Propriete       | Valeur                    |
|-----------------|---------------------------|
| SGBD            | PostgreSQL 15 Alpine      |
| Utilisateur     | plateforme_user           |
| Mot de passe    | plateforme_pass           |
| Port            | 5432                      |
| Volume          | postgres_data (persistant)|

### 6.2 Bases de donnees

| Base de donnees   | Service associe       |
|-------------------|-----------------------|
| invoice_db        | invoice-service       |
| payment_db        | payment-service       |
| subscription_db   | subscription-service  |
| notification_db   | notification-service  |
| user_auth_db      | user-auth-service + Keycloak |

### 6.3 Initialisation

Les bases sont creees automatiquement au premier demarrage via le script `init-scripts/01-create-databases.sh`. Si le volume existe deja, le script ne s'execute pas. Dans ce cas, creer manuellement :

```bash
docker exec -it plateforme-db psql -U plateforme_user -c "CREATE DATABASE invoice_db;"
docker exec -it plateforme-db psql -U plateforme_user -c "CREATE DATABASE payment_db;"
docker exec -it plateforme-db psql -U plateforme_user -c "CREATE DATABASE subscription_db;"
docker exec -it plateforme-db psql -U plateforme_user -c "CREATE DATABASE notification_db;"
docker exec -it plateforme-db psql -U plateforme_user -c "CREATE DATABASE user_auth_db;"
```

### 6.4 Schema (DDL)

Les schemas sont generes automatiquement par Hibernate (`spring.jpa.hibernate.ddl-auto: update`). Les index suivants sont definis :

**Table `invoices` :**
- `idx_invoice_number` sur `invoiceNumber`
- `idx_invoice_status` sur `status`
- `idx_invoice_owner` sur `ownerUserId`

**Table `invoice_items` :**
- `idx_invoice_item_invoice` sur `invoice_id`

**Table `products` :**
- `idx_product_sku` sur `sku` (unique)
- `idx_product_name` sur `name`
- `idx_product_category` sur `category`
- `idx_product_tenant` sur `tenantId`

---

## 7. API Reference

Toutes les requetes passent par l'API Gateway sur `http://localhost:8080`.

### 7.1 Factures (`/api/invoices`)

| Methode | Endpoint                          | Description                    | Parametres                    |
|---------|-----------------------------------|--------------------------------|-------------------------------|
| GET     | `/api/invoices`                   | Lister les factures (pagine)   | `ownerUserId?`, `status?`, `page`, `size` |
| POST    | `/api/invoices`                   | Creer une facture              | Body: `CreateInvoiceRequest`  |
| GET     | `/api/invoices/{id}`              | Detail d'une facture           | `ownerUserId?`                |
| PUT     | `/api/invoices/{id}`              | Modifier un brouillon          | `ownerUserId`, Body: `CreateInvoiceRequest` |
| DELETE  | `/api/invoices/{id}`              | Supprimer (brouillon ou annulee)| `ownerUserId`                |
| POST    | `/api/invoices/{id}/validate`     | Valider (DRAFT -> VALIDATED)   | `ownerUserId`                |
| POST    | `/api/invoices/{id}/send`         | Envoyer (VALIDATED -> SENT)    | `ownerUserId`                |
| POST    | `/api/invoices/{id}/cancel`       | Annuler une facture            | `ownerUserId`                |
| PATCH   | `/api/invoices/{id}/status`       | Modifier le statut directement | Body: `InvoiceStatusUpdateRequest` |
| GET     | `/api/invoices/{id}/pdf`          | Telecharger le PDF             | `ownerUserId`                |
| GET     | `/api/invoices/stats/{ownerUserId}` | Statistiques du marchand     | -                             |

**Corps de requete `CreateInvoiceRequest` :**

```json
{
  "ownerUserId": "11111111-1111-1111-1111-111111111111",
  "clientName": "Societe Atlas",
  "clientEmail": "contact@atlas.tn",
  "billingAddress": "Tunis, TN",
  "vatRate": 19,
  "issueDate": "2026-01-10",
  "dueDate": "2026-02-10",
  "items": [
    {
      "description": "Audit et conseil",
      "quantity": 1,
      "unitPrice": 60.00,
      "taxRate": 19
    },
    {
      "description": "Integration plateforme",
      "quantity": 2,
      "unitPrice": 40.00,
      "taxRate": 19
    }
  ]
}
```

**Reponse `Invoice` :**

```json
{
  "id": "11111111-1111-1111-1111-111111111101",
  "invoiceNumber": "FAC-2026-00001",
  "ownerUserId": "11111111-1111-1111-1111-111111111111",
  "clientName": "Societe Atlas",
  "clientEmail": "contact@atlas.tn",
  "billingAddress": "Tunis, TN",
  "subtotalHt": 140.00,
  "vatRate": 19.00,
  "vatAmount": 26.60,
  "totalTtc": 166.60,
  "status": "VALIDATED",
  "issueDate": "2026-01-10",
  "dueDate": "2026-02-10",
  "createdAt": "2026-01-10T09:00:00",
  "updatedAt": "2026-01-10T09:30:00",
  "items": [
    {
      "id": "...",
      "description": "Audit et conseil",
      "quantity": 1.0,
      "unitPrice": 60.00,
      "taxRate": 19.00,
      "lineTotalHt": 60.00
    }
  ]
}
```

**Reponse `MerchantInvoiceStats` :**

```json
{
  "ownerUserId": "11111111-1111-1111-1111-111111111111",
  "totalInvoices": 10,
  "paidInvoices": 3,
  "draftInvoices": 4,
  "sentInvoices": 2,
  "totalRevenue": 45000.00
}
```

### 7.2 Paiements (`/api/payments`)

| Methode | Endpoint                | Description            |
|---------|-------------------------|------------------------|
| GET     | `/api/payments`         | Lister les paiements   |

### 7.3 Cartes (`/api/cards`)

| Methode | Endpoint                | Description            | Parametres     |
|---------|-------------------------|------------------------|----------------|
| GET     | `/api/cards`            | Lister les cartes      | `userId`       |
| POST    | `/api/cards`            | Ajouter une carte      | Body: `CardPayload` |
| DELETE  | `/api/cards/{id}`       | Supprimer une carte    | -              |

### 7.4 Abonnements (`/api/subscriptions`)

| Methode | Endpoint                          | Description              |
|---------|-----------------------------------|--------------------------|
| GET     | `/api/plans`                      | Lister les plans         |
| POST    | `/api/subscriptions`              | Creer un abonnement      |
| GET     | `/api/subscriptions/user/{userId}`| Abonnement d'un utilisateur |
| POST    | `/api/subscriptions/{id}/cancel`  | Annuler un abonnement    |

### 7.5 Utilisateurs (`/api/users`)

| Methode | Endpoint                | Description              |
|---------|-------------------------|--------------------------|
| GET     | `/api/users/me`         | Profil de l'utilisateur connecte |
| PUT     | `/api/users/{id}`       | Mettre a jour le profil  |
| DELETE  | `/api/users/{id}`       | Supprimer un utilisateur |

### 7.6 Notifications (`/api/notifications`)

| Methode | Endpoint                              | Description                    |
|---------|---------------------------------------|--------------------------------|
| GET     | `/api/notifications/user/{userId}`    | Notifications d'un utilisateur |
| DELETE  | `/api/notifications/{id}`             | Supprimer une notification     |
| PATCH   | `/api/notifications/{id}/read`        | Marquer comme lue              |
| GET     | `/api/notifications/preferences`      | Preferences de notification    |
| PUT     | `/api/notifications/preferences`      | Modifier les preferences       |
| POST    | `/api/notifications/test-email?to=`   | Envoyer un email de test       |

---

## 8. Cycle de vie d'une facture

```
  +----------+
  |  DRAFT   |  <-- Creation initiale
  +----+-----+
       |
       | validate()   -- Attribue un numero FAC-YYYY-XXXXX
       v
  +-----------+
  | VALIDATED |
  +----+------+
       |
       | send()
       v
  +-----------+
  |   SENT    |
  +----+------+
       |
       | (paiement recu)
       v
  +-----------+
  |   PAID    |  <-- Etat final
  +-----------+

  Depuis VALIDATED, SENT :
       |
       | cancel()
       v
  +-----------+
  | CANCELLED |
  +-----------+
```

**Regles metier :**

| Action     | Depuis         | Vers        | Conditions                    |
|------------|----------------|-------------|-------------------------------|
| Creer      | -              | DRAFT       | Calcul automatique des totaux |
| Modifier   | DRAFT          | DRAFT       | Seuls les brouillons          |
| Valider    | DRAFT          | VALIDATED   | Attribue numero FAC-YYYY-XXXXX |
| Envoyer    | VALIDATED      | SENT        | Doit etre validee d'abord     |
| Annuler    | VALIDATED/SENT | CANCELLED   | -                             |
| Supprimer  | DRAFT/CANCELLED| (supprime)  | Suppression definitive        |
| PDF        | SENT/PAID      | -           | Telecharger le PDF            |

**Numerotation :** Format `FAC-YYYY-XXXXX` (ex: `FAC-2026-00001`), attribue lors de la validation.

**Calcul des totaux :**
- `subtotalHt` = somme des `lineTotalHt` de chaque ligne
- `vatAmount` = `subtotalHt` x `vatRate` / 100
- `totalTtc` = `subtotalHt` + `vatAmount`

---

## 9. Generation PDF

### 9.1 Technologie

La generation PDF utilise **iText7** (version 8.0.2) pour creer des documents PDF natifs de haute qualite.

### 9.2 Contenu du PDF

Le PDF genere contient les sections suivantes :

1. **En-tete** : Titre "FACTURE", numero de facture, statut, dates d'emission et d'echeance
2. **Bloc client** : Nom du client, email, adresse de facturation (pas l'ID admin)
3. **Tableau des lignes** : Description, quantite, prix unitaire, taux TVA, total HT par ligne
4. **Bloc totaux** : Sous-total HT, TVA (taux et montant), Total TTC en TND
5. **Pied de page** : Message de remerciement

### 9.3 Endpoint

```
GET /api/invoices/{id}/pdf?ownerUserId={uuid}
```

**Reponse :**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="facture-FAC-2026-00001.pdf"`
- Body: contenu binaire PDF

### 9.4 Service (`InvoicePdfService`)

Fichier : `services/invoice-service/src/main/java/com/plateforme/electronique/invoice/service/InvoicePdfService.java`

Caracteristiques :
- Format A4 avec marges de 40pt
- Palette de couleurs professionnelle (bleu fonce, gris)
- Tableau avec lignes alternees pour meilleure lisibilite
- Montants formates en locale francaise (virgule decimale)
- Devise TND (Dinar Tunisien)

---

## 10. Authentification

### 10.1 Keycloak

| Propriete       | Valeur                      |
|-----------------|-----------------------------|
| URL             | http://localhost:8081        |
| Admin console   | http://localhost:8081/admin  |
| Admin login     | admin / admin               |
| Realm           | plateforme-electronique     |

### 10.2 Frontend (mode demo)

Pour le developpement, des identifiants demo sont pre-remplis sur la page de connexion :

| Propriete       | Valeur              |
|-----------------|---------------------|
| Email           | admin@example.com   |
| Mot de passe    | admin1234           |
| Stockage        | localStorage (`access_token`, `refresh_token`, `demo_auth`) |

La connexion appelle l'API backend (`POST /api/auth/login`). Si l'utilisateur n'existe pas encore, un enregistrement automatique est effectue via `POST /api/auth/register`. Les tokens JWT retournes sont stockes dans le `localStorage` et injectes dans toutes les requetes API.

La route `/admin/*` est protegee par le composant `ProtectedRoute` qui verifie `localStorage.demo_auth`.

### 10.3 JWT

Les tokens JWT sont stockes dans `localStorage` sous les cles :
- `access_token`
- `jwt_token`

Le client API injecte automatiquement le header `Authorization: Bearer <token>` dans toutes les requetes.

---

## 11. Infrastructure et deploiement

### 11.1 Docker Compose

Tous les services sont orchestres via `docker-compose.yml`. Conteneurs :

| Conteneur                    | Image / Build              | Port expose |
|------------------------------|----------------------------|-------------|
| plateforme-db                | postgres:15-alpine         | 5432        |
| plateforme-keycloak          | keycloak:22.0              | 8081        |
| plateforme-redis             | redis:7-alpine             | 6379        |
| plateforme-eureka            | ./services/eureka-server   | 8761        |
| plateforme-gateway           | ./services/api-gateway     | 8080        |
| invoice-service              | ./services/invoice-service | -           |
| payment-service              | ./services/payment-service | -           |
| plateforme-subscription      | ./services/subscription-service | -      |
| plateforme-notification      | ./services/notification-service | -      |
| plateforme-userauth          | ./services/user-auth-service | -         |
| plateforme-signature         | ./services/signature-service | -         |
| plateforme-frontend          | ./frontend                 | 3000        |

**Volumes persistants :**
- `postgres_data` : donnees PostgreSQL
- `keycloak_data` : configuration Keycloak
- `redis_data` : donnees Redis

**Reseau :** `plateforme-network` (bridge)

### 11.2 Dockerfiles

Tous les services Spring Boot utilisent un build multi-stage :

```dockerfile
# Stage 1 : Build Maven
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src src
RUN mvn -DskipTests package

# Stage 2 : Runtime JRE leger
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar /app/app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

Le frontend utilise egalement un build multi-stage (Node.js + Nginx).

### 11.3 Kubernetes (K3s)

Un script `k3s.sh` est fourni pour installer un cluster K3s mono-noeud sur Ubuntu :

```bash
./k3s.sh
```

Le kubeconfig est disponible dans `/etc/rancher/k3s/k3s.yaml`.

---

## 12. Guide de demarrage

### 12.1 Prerequis

- Docker et Docker Compose
- Git
- (Optionnel) Java 21 et Maven pour le developpement local
- (Optionnel) Node.js 20 pour le developpement frontend

### 12.2 Demarrage rapide

```bash
# 1. Cloner le projet
git clone <repository-url>
cd plateforme_electronique_k8s

# 2. Construire tous les services
docker compose build

# 3. Demarrer l'ensemble de la plateforme
docker compose up -d

# 4. Verifier que tous les services sont en cours d'execution
docker ps

# 5. Verifier l'enregistrement Eureka
# Ouvrir http://localhost:8761 dans le navigateur
```

### 12.3 Acces aux services

| Service           | URL                         |
|-------------------|-----------------------------|
| Frontend          | http://localhost:3000        |
| API Gateway       | http://localhost:8080        |
| Eureka Dashboard  | http://localhost:8761        |
| Keycloak Admin    | http://localhost:8081/admin  |

### 12.4 Rebuilder un service specifique

```bash
# Rebuilder et redemarrer un service
docker compose build invoice-service
docker compose up -d invoice-service

# Rebuilder le frontend
docker compose build frontend
docker compose up -d frontend

# Voir les logs d'un service
docker logs plateforme_electronique_k8s-invoice-service-1 --tail 50

# Rebuilder tous les services
docker compose up -d --build
```

### 12.5 Developpement local (sans Docker)

```bash
# Backend - Invoice Service
cd services/invoice-service
mvn spring-boot:run

# Frontend - Mode developpement
cd frontend
npm install
npm start
```

### 12.6 Ajouter des factures de test

Un script interactif est disponible pour inserer des factures directement en base :

```bash
./AJOUTER_FACTURE.sh
```

---

## 13. Scaling

### 13.1 Avec Docker Compose

```bash
# Scaler le service de facturation a 3 instances
docker compose up -d --scale invoice-service=3

# Scaler plusieurs services
docker compose up -d --scale invoice-service=3 --scale payment-service=2
```

Le load balancing est gere automatiquement par Eureka + Spring Cloud LoadBalancer au niveau de l'API Gateway.

### 13.2 Avec Kubernetes

Deployer sur K3s apres installation :

```bash
# Installer K3s
./k3s.sh

# Utiliser kubectl pour deployer
sudo kubectl apply -f k8s/
```

---

## 14. Structure du projet

```
plateforme_electronique_k8s/
|
|-- docker-compose.yml              # Orchestration de tous les services
|-- README.md                       # Presentation du projet
|-- DOCUMENTATION.md                # Documentation technique (ce fichier)
|-- setup.sh                        # Script d'installation Aider (dev IA)
|-- k3s.sh                          # Script d'installation K3s
|-- AJOUTER_FACTURE.sh              # Script d'insertion de factures en base
|
|-- init-scripts/
|   |-- 01-create-databases.sh      # Initialisation des bases PostgreSQL
|
|-- frontend/
|   |-- Dockerfile                  # Build multi-stage (Node + Nginx)
|   |-- nginx.conf                  # Configuration Nginx
|   |-- package.json                # Dependances npm
|   |-- tailwind.config.js          # Configuration Tailwind CSS
|   |-- tsconfig.json               # Configuration TypeScript
|   |-- src/
|       |-- App.tsx                 # Routes principales
|       |-- api/
|       |   |-- gateway.ts          # Client API centralise
|       |   |-- types.ts            # Types TypeScript
|       |-- components/
|       |   |-- AdminHeader.tsx     # Barre de navigation
|       |   |-- Sidebar.tsx         # Menu lateral
|       |-- pages/
|           |-- Login.tsx           # Page de connexion
|           |-- Admin.tsx           # Layout admin + sous-routes
|           |-- admin/
|               |-- Dashboard.tsx   # Tableau de bord
|               |-- Invoices.tsx    # Liste des factures
|               |-- InvoiceCreate.tsx # Creation de facture
|               |-- InvoiceDetail.tsx # Detail d'une facture
|               |-- InvoiceEdit.tsx   # Edition d'un brouillon
|               |-- Clients.tsx     # Gestion des clients
|               |-- Payments.tsx    # Suivi des paiements
|               |-- Profile.tsx     # Profil utilisateur
|               |-- Subscriptions.tsx # Gestion des abonnements
|               |-- Cards.tsx       # Cartes de paiement
|               |-- Settings.tsx    # Parametres
|
|-- services/
    |-- api-gateway/                # API Gateway (Spring Cloud Gateway)
    |-- eureka-server/              # Service Registry (Netflix Eureka)
    |-- invoice-service/            # Service de facturation
    |   |-- src/main/java/.../
    |       |-- controller/
    |       |   |-- InvoiceController.java
    |       |-- service/
    |       |   |-- InvoiceService.java
    |       |   |-- InvoicePdfService.java    # Generation PDF iText7
    |       |-- entity/
    |       |   |-- Invoice.java
    |       |   |-- InvoiceItem.java
    |       |   |-- Product.java
    |       |   |-- Address.java
    |       |-- repository/
    |       |   |-- InvoiceRepository.java
    |       |-- dto/
    |           |-- CreateInvoiceRequest.java
    |           |-- CreateInvoiceItemRequest.java
    |           |-- InvoiceStatusUpdateRequest.java
    |           |-- MerchantInvoiceStatsResponse.java
    |-- payment-service/            # Service de paiement
    |-- subscription-service/       # Service d'abonnement
    |-- notification-service/       # Service de notification
    |-- user-auth-service/          # Service d'authentification
    |-- signature-service/          # Service de signature (placeholder)
```

---

## 15. Corrections et changements

### 15.1 Correction : Erreur API sur la page Profil

**Probleme :**
La page de connexion (`Login.tsx`) fonctionnait en mode demo cote client uniquement. Elle comparait les identifiants saisis avec des valeurs codees en dur et stockait simplement `demo_auth=true` dans le `localStorage`, sans jamais appeler l'API backend `/api/auth/login`. Aucun token JWT n'etait donc enregistre.

Lorsque l'utilisateur accedait a la page Profil (`/admin/profile`), le composant appelait `GET /api/users/me` sans header `Authorization`. Le backend retournait une erreur `401 Unauthorized`, affichee comme "Erreur API" dans l'interface.

**Cause racine :**
Deconnexion entre le mecanisme de login frontend (demo, sans appel API) et les endpoints backend proteges par JWT.

**Fichiers modifies :**

| Fichier | Modification |
|---------|-------------|
| `frontend/src/api/types.ts` | Ajout des types `AuthResponse`, `LoginPayload` et `RegisterPayload` |
| `frontend/src/api/gateway.ts` | Ajout des fonctions `loginUser()` et `registerUser()` appelant `/api/auth/login` et `/api/auth/register` |
| `frontend/src/pages/Login.tsx` | Remplacement de la verification cote client par un appel reel a l'API backend. Stockage du `access_token` et `refresh_token` dans le `localStorage`. Fallback sur l'enregistrement automatique au premier usage |
| `frontend/src/components/AdminHeader.tsx` | Nettoyage des tokens `access_token` et `refresh_token` du `localStorage` lors de la deconnexion |

**Flux d'authentification apres correction :**

```
1. L'utilisateur saisit ses identifiants sur /login
2. Le frontend appelle POST /api/auth/login
3. Si l'utilisateur n'existe pas, fallback sur POST /api/auth/register
4. Le backend retourne { accessToken, refreshToken, expiresInSeconds }
5. Les tokens sont stockes dans localStorage (access_token, refresh_token)
6. Le client API (apiFetch) injecte automatiquement le header Authorization: Bearer <token>
7. Les endpoints proteges (/api/users/me, PUT /api/users/{id}, etc.) fonctionnent correctement
```

**Identifiants demo mis a jour :**

| Propriete | Valeur |
|-----------|--------|
| Email | admin@example.com |
| Mot de passe | admin1234 |

Le mot de passe a ete modifie de `admin123!` a `admin1234` pour respecter la contrainte de validation backend (`@Size(min = 8)`).

---

## URLs de reference rapide

| Ressource               | URL                                    |
|--------------------------|----------------------------------------|
| Application              | http://localhost:3000                   |
| API Gateway              | http://localhost:8080                   |
| Eureka Dashboard         | http://localhost:8761                   |
| Keycloak Admin           | http://localhost:8081/admin             |
| PostgreSQL               | localhost:5432                          |
| Redis                    | localhost:6379                          |
| Login demo               | admin@example.com / admin1234          |
| Keycloak admin           | admin / admin                          |
