#!/bin/bash

# Script de restauration de la base de données PostgreSQL
# Auteur: yassmineg
# Date: 27 janvier 2026

echo "🔄 Restauration de la Base de Données PostgreSQL"
echo "================================================="
echo ""

# Configuration
CONTAINER_NAME="plateforme-db"
DB_USER="plateforme_user"
DB_NAME="invoice_db"
BACKUP_DIR="$HOME/backups/plateforme-db"

# Vérifier que le conteneur PostgreSQL tourne
echo "🔍 Vérification du conteneur PostgreSQL..."
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "❌ Erreur: Le conteneur $CONTAINER_NAME n'est pas lancé"
    echo "   Lancez d'abord: docker compose up -d"
    exit 1
fi
echo "✅ Conteneur PostgreSQL actif"
echo ""

# Si un fichier de backup est passé en argument
if [ -n "$1" ]; then
    BACKUP_FILE="$1"
else
    # Lister les backups disponibles
    echo "📂 Backups disponibles:"
    echo ""
    
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
        echo "❌ Aucun backup trouvé dans $BACKUP_DIR"
        echo "   Créez d'abord un backup avec: ./BACKUP-DATABASE.sh"
        exit 1
    fi
    
    # Afficher les backups avec numéro
    FILES=()
    i=1
    for file in "$BACKUP_DIR"/*.sql.gz "$BACKUP_DIR"/*.sql; do
        if [ -f "$file" ]; then
            SIZE=$(du -h "$file" | cut -f1)
            DATE=$(stat -c %y "$file" 2>/dev/null || stat -f "%Sm" "$file")
            echo "   [$i] $(basename $file) - $SIZE - $DATE"
            FILES+=("$file")
            ((i++))
        fi
    done
    
    echo ""
    echo "Entrez le numéro du backup à restaurer (ou 'q' pour quitter):"
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

echo ""
echo "📋 Informations de restauration:"
echo "   Fichier: $BACKUP_FILE"
echo "   Taille:  $(du -h "$BACKUP_FILE" | cut -f1)"
echo "   Base:    $DB_NAME"
echo ""

# Avertissement
echo "⚠️  ATTENTION !"
echo "   Cette opération va ÉCRASER toutes les données actuelles"
echo "   de la base de données '$DB_NAME'"
echo ""
echo "Voulez-vous continuer? (tapez 'OUI' en majuscules pour confirmer)"
read -r CONFIRM

if [ "$CONFIRM" != "OUI" ]; then
    echo "Annulé."
    exit 0
fi

# Créer un backup de sécurité avant la restauration
echo ""
echo "💾 Création d'un backup de sécurité avant restauration..."
SAFETY_BACKUP="$BACKUP_DIR/safety-backup-before-restore-$(date +%Y%m%d-%H%M%S).sql.gz"
docker exec -t "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$SAFETY_BACKUP"
echo "✅ Backup de sécurité créé: $SAFETY_BACKUP"
echo ""

# Décompresser si nécessaire
TEMP_FILE=""
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "🗜️  Décompression du backup..."
    TEMP_FILE="/tmp/restore-$(basename "$BACKUP_FILE" .gz)"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    RESTORE_FILE="$TEMP_FILE"
else
    RESTORE_FILE="$BACKUP_FILE"
fi

# Restauration
echo "⏳ Restauration en cours..."
echo ""

# Supprimer et recréer la base
echo "🗑️  Suppression de la base existante..."
docker exec -t "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"

echo "📦 Création d'une nouvelle base..."
docker exec -t "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"

echo "📥 Restauration des données..."
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$RESTORE_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "================================================="
    echo "✅ Restauration réussie !"
    echo "================================================="
    echo ""
    
    # Vérifier les données restaurées
    echo "📊 Vérification des données restaurées:"
    echo ""
    
    # Compter les factures
    FACTURES_COUNT=$(docker exec -t "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM factures;" 2>/dev/null | tr -d ' \n\r')
    
    if [ ! -z "$FACTURES_COUNT" ]; then
        echo "   ✅ Factures restaurées: $FACTURES_COUNT"
    fi
    
    # Compter les clients
    CLIENTS_COUNT=$(docker exec -t "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM clients;" 2>/dev/null | tr -d ' \n\r')
    
    if [ ! -z "$CLIENTS_COUNT" ]; then
        echo "   ✅ Clients restaurés: $CLIENTS_COUNT"
    fi
    
    echo ""
    echo "💾 Backup de sécurité conservé: $SAFETY_BACKUP"
    echo ""
    
else
    echo "❌ Erreur lors de la restauration"
    echo ""
    echo "💾 Vos données sont toujours dans le backup de sécurité:"
    echo "   $SAFETY_BACKUP"
    
    # Nettoyer
    [ -n "$TEMP_FILE" ] && rm -f "$TEMP_FILE"
    exit 1
fi

# Nettoyer le fichier temporaire
[ -n "$TEMP_FILE" ] && rm -f "$TEMP_FILE"

echo "================================================="
echo "✨ Restauration terminée avec succès !"
echo "================================================="
