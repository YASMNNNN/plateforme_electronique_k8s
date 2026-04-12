#!/bin/bash

# Script de sauvegarde de la base de données PostgreSQL
# Auteur: yassmineg
# Date: 27 janvier 2026 — mis à jour le 12 avril 2026

echo "💾 Sauvegarde de la Base de Données PostgreSQL"
echo "==============================================="
echo ""

# Configuration
CONTAINER_NAME="plateforme-db"
DB_USER="plateforme_user"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backup_bd"
DATE=$(date +%Y%m%d-%H%M%S)

# Bases applicatives à sauvegarder
DATABASES=(
    invoice_db
    payment_db
    subscription_db
    notification_db
    user_auth_db
    plateforme_electronique
)

# Créer le dossier de backup s'il n'existe pas
mkdir -p "$BACKUP_DIR"

# Vérifier que le conteneur PostgreSQL tourne
echo "🔍 Vérification du conteneur PostgreSQL..."
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "❌ Erreur: Le conteneur $CONTAINER_NAME n'est pas lancé"
    echo "   Lancez d'abord: docker-compose up -d"
    exit 1
fi
echo "✅ Conteneur PostgreSQL actif"
echo ""

# ---- Mode : base individuelle ou toutes ----
MODE="${1:---all}"

if [ "$MODE" = "--all" ]; then
    # Sauvegarder chaque base individuellement (permet la restauration sélective)
    echo "📦 Sauvegarde de toutes les bases applicatives..."
    echo ""

    TOTAL=0
    FAILED=0
    for DB in "${DATABASES[@]}"; do
        BACKUP_FILE="$BACKUP_DIR/backup-${DB}-${DATE}.sql.gz"
        echo -n "   ⏳ $DB ... "
        if docker exec -t "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB" 2>/dev/null | gzip > "$BACKUP_FILE"; then
            SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
            echo "✅ ($SIZE)"
            ((TOTAL++))
        else
            echo "❌ échec"
            rm -f "$BACKUP_FILE"
            ((FAILED++))
        fi
    done

    echo ""

    # Sauvegarder aussi un dump global (pg_dumpall) comme filet de sécurité
    ALL_BACKUP_FILE="$BACKUP_DIR/backup-ALL-DATABASES-${DATE}.sql.gz"
    echo -n "   ⏳ Dump global (pg_dumpall) ... "
    if docker exec -t "$CONTAINER_NAME" pg_dumpall -U "$DB_USER" 2>/dev/null | gzip > "$ALL_BACKUP_FILE"; then
        ALL_SIZE=$(du -h "$ALL_BACKUP_FILE" | cut -f1)
        echo "✅ ($ALL_SIZE)"
    else
        echo "❌ échec"
        rm -f "$ALL_BACKUP_FILE"
    fi

    echo ""
    echo "==============================================="
    echo "✅ Sauvegarde terminée : $TOTAL bases OK, $FAILED en erreur"
    echo "==============================================="
else
    # Sauvegarder une seule base passée en argument
    DB_NAME="$MODE"
    BACKUP_FILE="$BACKUP_DIR/backup-${DB_NAME}-${DATE}.sql.gz"

    echo "📋 Sauvegarde de la base : $DB_NAME"
    echo "   Destination : $BACKUP_FILE"
    echo ""

    echo "⏳ Sauvegarde en cours..."
    if docker exec -t "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" 2>/dev/null | gzip > "$BACKUP_FILE"; then
        SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        echo ""
        echo "==============================================="
        echo "✅ Sauvegarde réussie ! ($SIZE)"
        echo "==============================================="
    else
        echo "❌ Erreur lors de la sauvegarde de $DB_NAME"
        rm -f "$BACKUP_FILE"
        exit 1
    fi
fi

echo ""

# Liste des backups existants
echo "📂 Backups disponibles dans $BACKUP_DIR :"
ls -lht "$BACKUP_DIR" | grep -v "^total" | head -20 | awk '{print "   " $9 " — " $5}'
echo ""

BACKUP_COUNT=$(ls -1 "$BACKUP_DIR" 2>/dev/null | wc -l)
echo "📊 Total de backups : $BACKUP_COUNT"
echo ""

echo "💡 Pour restaurer : ./RESTORE-DATABASE.sh"
echo ""
echo "==============================================="
echo "✨ Terminé !"
echo "==============================================="
