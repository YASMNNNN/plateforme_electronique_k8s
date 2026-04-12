#!/bin/bash

# Script de restauration de la base de données PostgreSQL
# Auteur: yassmineg
# Date: 27 janvier 2026 — mis à jour le 12 avril 2026

echo "🔄 Restauration de la Base de Données PostgreSQL"
echo "================================================="
echo ""

# Configuration
CONTAINER_NAME="plateforme-db"
DB_USER="plateforme_user"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backup_bd"

# Bases applicatives connues
DATABASES=(
    invoice_db
    payment_db
    subscription_db
    notification_db
    user_auth_db
    plateforme_electronique
)

# Vérifier que le conteneur PostgreSQL tourne
echo "🔍 Vérification du conteneur PostgreSQL..."
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "❌ Erreur: Le conteneur $CONTAINER_NAME n'est pas lancé"
    echo "   Lancez d'abord: docker-compose up -d"
    exit 1
fi
echo "✅ Conteneur PostgreSQL actif"
echo ""

# ================================================================
# Déterminer le fichier de backup à restaurer
# ================================================================
if [ -n "$1" ]; then
    BACKUP_FILE="$1"
else
    # Lister les backups disponibles
    echo "📂 Backups disponibles :"
    echo ""

    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        echo "❌ Aucun backup trouvé dans $BACKUP_DIR"
        echo "   Créez d'abord un backup avec : ./BACKUP-DATABASE.sh"
        exit 1
    fi

    FILES=()
    i=1
    for file in $(ls -1t "$BACKUP_DIR"/*.sql.gz "$BACKUP_DIR"/*.sql 2>/dev/null); do
        if [ -f "$file" ]; then
            SIZE=$(du -h "$file" | cut -f1)
            FDATE=$(stat -c "%y" "$file" 2>/dev/null | cut -d. -f1)
            echo "   [$i] $(basename "$file")  —  $SIZE  —  $FDATE"
            FILES+=("$file")
            ((i++))
        fi
    done

    echo ""
    echo "Entrez le numéro du backup à restaurer (ou 'q' pour quitter) :"
    read -r CHOICE

    if [[ "$CHOICE" =~ ^[Qq]$ ]]; then
        echo "Annulé."
        exit 0
    fi

    if ! [[ "$CHOICE" =~ ^[0-9]+$ ]] || [ "$CHOICE" -lt 1 ] || [ "$CHOICE" -gt "${#FILES[@]}" ]; then
        echo "❌ Choix invalide"
        exit 1
    fi

    BACKUP_FILE="${FILES[$((CHOICE-1))]}"
fi

# Vérifier que le fichier existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Erreur: Fichier introuvable: $BACKUP_FILE"
    exit 1
fi

BASENAME=$(basename "$BACKUP_FILE")
echo ""
echo "📋 Fichier sélectionné : $BASENAME"
echo "   Taille : $(du -h "$BACKUP_FILE" | cut -f1)"
echo ""

# ================================================================
# Détecter le type de backup : base individuelle ou pg_dumpall
# ================================================================
IS_GLOBAL=false
DB_NAME=""

if echo "$BASENAME" | grep -q "ALL-DATABASES"; then
    IS_GLOBAL=true
    echo "   Type : dump global (toutes les bases)"
else
    # Extraire le nom de la base depuis le nom du fichier : backup-<db_name>-<date>.sql[.gz]
    DB_NAME=$(echo "$BASENAME" | sed 's/^backup-//;s/-[0-9]\{8\}-[0-9]\{6\}\.sql\(\.gz\)\?$//')
    if [ -z "$DB_NAME" ]; then
        echo "❌ Impossible de déterminer la base cible depuis le nom du fichier."
        echo "   Format attendu : backup-<nom_base>-YYYYMMDD-HHMMSS.sql.gz"
        exit 1
    fi
    echo "   Type : base individuelle → $DB_NAME"
fi

echo ""

# ================================================================
# Confirmation
# ================================================================
if [ "$IS_GLOBAL" = true ]; then
    echo "⚠️  ATTENTION !"
    echo "   Cette opération va restaurer TOUTES les bases de données"
    echo "   à partir du dump global. Les données actuelles seront écrasées."
else
    echo "⚠️  ATTENTION !"
    echo "   Cette opération va ÉCRASER toutes les données actuelles"
    echo "   de la base '$DB_NAME'."
fi

echo ""
echo "Voulez-vous continuer ? (tapez 'OUI' en majuscules pour confirmer)"
read -r CONFIRM

if [ "$CONFIRM" != "OUI" ]; then
    echo "Annulé."
    exit 0
fi
echo ""

# ================================================================
# Backup de sécurité avant restauration
# ================================================================
echo "💾 Création d'un backup de sécurité avant restauration..."
SAFETY_DATE=$(date +%Y%m%d-%H%M%S)

if [ "$IS_GLOBAL" = true ]; then
    SAFETY_FILE="$BACKUP_DIR/safety-ALL-before-restore-${SAFETY_DATE}.sql.gz"
    docker exec -t "$CONTAINER_NAME" pg_dumpall -U "$DB_USER" 2>/dev/null | gzip > "$SAFETY_FILE"
else
    SAFETY_FILE="$BACKUP_DIR/safety-${DB_NAME}-before-restore-${SAFETY_DATE}.sql.gz"
    docker exec -t "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" 2>/dev/null | gzip > "$SAFETY_FILE"
fi
echo "✅ Backup de sécurité : $SAFETY_FILE"
echo ""

# ================================================================
# Décompresser si nécessaire
# ================================================================
TEMP_FILE=""
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "🗜️  Décompression du backup..."
    TEMP_FILE="/tmp/restore-$$-$(basename "$BACKUP_FILE" .gz)"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    RESTORE_FILE="$TEMP_FILE"
else
    RESTORE_FILE="$BACKUP_FILE"
fi

# ================================================================
# Restauration
# ================================================================
echo "⏳ Restauration en cours..."
echo ""

if [ "$IS_GLOBAL" = true ]; then
    # ---- Dump global : utiliser psql directement ----
    docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres < "$RESTORE_FILE" > /dev/null 2>&1
    RESULT=$?
else
    # ---- Base individuelle ----
    # Fermer les connexions actives
    docker exec -t "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c \
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" > /dev/null 2>&1

    # Supprimer et recréer la base
    echo "   🗑️  Suppression de la base $DB_NAME..."
    docker exec -t "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" > /dev/null 2>&1

    echo "   📦 Création de la base $DB_NAME..."
    docker exec -t "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;" > /dev/null 2>&1

    echo "   📥 Import des données..."
    docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$RESTORE_FILE" > /dev/null 2>&1
    RESULT=$?
fi

# ================================================================
# Vérification
# ================================================================
if [ $RESULT -eq 0 ]; then
    echo ""
    echo "================================================="
    echo "✅ Restauration réussie !"
    echo "================================================="
    echo ""

    # Vérifier les tables restaurées
    echo "📊 Vérification des données restaurées :"
    echo ""

    if [ "$IS_GLOBAL" = true ]; then
        TARGETS=("${DATABASES[@]}")
    else
        TARGETS=("$DB_NAME")
    fi

    for DB in "${TARGETS[@]}"; do
        TABLE_COUNT=$(docker exec -t "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB" -t -c \
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' \n\r')
        if [ -n "$TABLE_COUNT" ] && [ "$TABLE_COUNT" != "0" ]; then
            echo "   ✅ $DB : $TABLE_COUNT tables"
        else
            echo "   ⚠️  $DB : aucune table (base vide ou erreur)"
        fi
    done

    echo ""
    echo "💾 Backup de sécurité conservé : $(basename "$SAFETY_FILE")"
else
    echo ""
    echo "❌ Erreur lors de la restauration"
    echo ""
    echo "💾 Vos données sont dans le backup de sécurité :"
    echo "   $SAFETY_FILE"
    [ -n "$TEMP_FILE" ] && rm -f "$TEMP_FILE"
    exit 1
fi

# Nettoyer le fichier temporaire
[ -n "$TEMP_FILE" ] && rm -f "$TEMP_FILE"

echo ""
echo "================================================="
echo "✨ Restauration terminée avec succès !"
echo "================================================="
