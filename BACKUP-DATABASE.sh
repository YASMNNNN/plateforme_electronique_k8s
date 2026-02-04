#!/bin/bash

# Script de sauvegarde de la base de données PostgreSQL
# Auteur: yassmineg
# Date: 27 janvier 2026

echo "💾 Sauvegarde de la Base de Données PostgreSQL"
echo "==============================================="
echo ""

# Configuration
CONTAINER_NAME="plateforme-db"
DB_USER="plateforme_user"
DB_NAME="invoice_db"
BACKUP_DIR="$HOME/backups/plateforme-db"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup-$DB_NAME-$DATE.sql"

# Créer le dossier de backup s'il n'existe pas
mkdir -p "$BACKUP_DIR"

# Vérifier que le conteneur PostgreSQL tourne
echo "🔍 Vérification du conteneur PostgreSQL..."
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "❌ Erreur: Le conteneur $CONTAINER_NAME n'est pas lancé"
    echo "   Lancez d'abord: docker compose up -d"
    exit 1
fi
echo "✅ Conteneur PostgreSQL actif"
echo ""

# Afficher les informations
echo "📋 Informations de sauvegarde:"
echo "   Conteneur:  $CONTAINER_NAME"
echo "   Base:       $DB_NAME"
echo "   Utilisateur: $DB_USER"
echo "   Destination: $BACKUP_FILE"
echo ""

# Effectuer le backup
echo "⏳ Sauvegarde en cours..."
docker exec -t "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    # Vérifier la taille du fichier
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    
    echo ""
    echo "==============================================="
    echo "✅ Sauvegarde réussie !"
    echo "==============================================="
    echo ""
    echo "📦 Fichier de backup:"
    echo "   Chemin: $BACKUP_FILE"
    echo "   Taille: $BACKUP_SIZE"
    echo ""
    
    # Compresser le backup
    echo "🗜️  Compression du backup..."
    gzip "$BACKUP_FILE"
    COMPRESSED_FILE="$BACKUP_FILE.gz"
    COMPRESSED_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
    
    echo "✅ Backup compressé:"
    echo "   Fichier: $COMPRESSED_FILE"
    echo "   Taille: $COMPRESSED_SIZE"
    echo ""
    
    # Liste des backups existants
    echo "📂 Backups disponibles dans $BACKUP_DIR:"
    ls -lh "$BACKUP_DIR" | grep -v "^total" | awk '{print "   " $9 " - " $5}'
    echo ""
    
    # Nombre total de backups
    BACKUP_COUNT=$(ls -1 "$BACKUP_DIR" | wc -l)
    echo "📊 Total de backups: $BACKUP_COUNT"
    echo ""
    
    echo "💡 Pour restaurer ce backup:"
    echo "   ./RESTORE-DATABASE.sh $COMPRESSED_FILE"
    echo ""
    
else
    echo "❌ Erreur lors de la sauvegarde"
    exit 1
fi

# Proposer de sauvegarder toutes les bases
echo "💾 Voulez-vous aussi sauvegarder TOUTES les bases? (y/n)"
read -r BACKUP_ALL

if [[ "$BACKUP_ALL" =~ ^[Yy]$ ]]; then
    echo ""
    echo "📦 Sauvegarde de toutes les bases..."
    ALL_BACKUP_FILE="$BACKUP_DIR/backup-ALL-DATABASES-$DATE.sql"
    
    docker exec -t "$CONTAINER_NAME" pg_dumpall -U "$DB_USER" > "$ALL_BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        gzip "$ALL_BACKUP_FILE"
        ALL_SIZE=$(du -h "$ALL_BACKUP_FILE.gz" | cut -f1)
        echo "✅ Toutes les bases sauvegardées: $ALL_BACKUP_FILE.gz ($ALL_SIZE)"
    fi
fi

echo ""
echo "==============================================="
echo "✨ Sauvegarde terminée avec succès !"
echo "==============================================="
