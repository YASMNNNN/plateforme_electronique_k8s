#!/bin/bash

# Script de gestion des backups PostgreSQL
# Auteur: yassmineg

echo "🗂️  Gestion des Backups PostgreSQL"
echo "==================================="
echo ""

BACKUP_DIR="$HOME/backups/plateforme-db"

# Créer le dossier s'il n'existe pas
mkdir -p "$BACKUP_DIR"

# Menu principal
while true; do
    echo ""
    echo "Que voulez-vous faire?"
    echo ""
    echo "  1. 📋 Lister tous les backups"
    echo "  2. 💾 Créer un nouveau backup"
    echo "  3. 🔄 Restaurer un backup"
    echo "  4. 🗑️  Supprimer un backup"
    echo "  5. 🧹 Nettoyer les vieux backups (>30 jours)"
    echo "  6. 📊 Statistiques des backups"
    echo "  7. 🚪 Quitter"
    echo ""
    read -p "Votre choix (1-7): " CHOICE

    case $CHOICE in
        1)
            # Lister les backups
            echo ""
            echo "📂 Backups disponibles:"
            echo ""
            
            if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
                echo "   Aucun backup trouvé"
            else
                echo "   Fichier                                    Taille    Date"
                echo "   ────────────────────────────────────────────────────────────────"
                ls -lh "$BACKUP_DIR" | grep -v "^total" | awk '{printf "   %-42s %6s    %s %s %s\n", $9, $5, $6, $7, $8}'
                
                echo ""
                TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
                BACKUP_COUNT=$(ls -1 "$BACKUP_DIR" 2>/dev/null | wc -l)
                echo "   Total: $BACKUP_COUNT fichier(s) - $TOTAL_SIZE"
            fi
            ;;
            
        2)
            # Créer un backup
            echo ""
            if [ -f "./BACKUP-DATABASE.sh" ]; then
                ./BACKUP-DATABASE.sh
            else
                echo "❌ Script BACKUP-DATABASE.sh introuvable"
            fi
            ;;
            
        3)
            # Restaurer un backup
            echo ""
            if [ -f "./RESTORE-DATABASE.sh" ]; then
                ./RESTORE-DATABASE.sh
            else
                echo "❌ Script RESTORE-DATABASE.sh introuvable"
            fi
            ;;
            
        4)
            # Supprimer un backup
            echo ""
            echo "📂 Backups disponibles:"
            echo ""
            
            if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
                echo "   Aucun backup trouvé"
            else
                FILES=()
                i=1
                for file in "$BACKUP_DIR"/*; do
                    if [ -f "$file" ]; then
                        SIZE=$(du -h "$file" | cut -f1)
                        echo "   [$i] $(basename $file) - $SIZE"
                        FILES+=("$file")
                        ((i++))
                    fi
                done
                
                echo ""
                read -p "Numéro du backup à supprimer (ou 'q' pour annuler): " DEL_CHOICE
                
                if [[ ! "$DEL_CHOICE" =~ ^[Qq]$ ]]; then
                    if [[ "$DEL_CHOICE" =~ ^[0-9]+$ ]] && [ "$DEL_CHOICE" -ge 1 ] && [ "$DEL_CHOICE" -le "${#FILES[@]}" ]; then
                        FILE_TO_DELETE="${FILES[$((DEL_CHOICE-1))]}"
                        echo ""
                        echo "⚠️  Voulez-vous vraiment supprimer:"
                        echo "   $(basename "$FILE_TO_DELETE")"
                        read -p "Confirmer (y/n): " CONFIRM
                        
                        if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
                            rm "$FILE_TO_DELETE"
                            echo "✅ Backup supprimé"
                        else
                            echo "Annulé"
                        fi
                    else
                        echo "❌ Choix invalide"
                    fi
                fi
            fi
            ;;
            
        5)
            # Nettoyer les vieux backups
            echo ""
            echo "🧹 Recherche des backups de plus de 30 jours..."
            
            OLD_BACKUPS=$(find "$BACKUP_DIR" -type f -mtime +30 2>/dev/null)
            
            if [ -z "$OLD_BACKUPS" ]; then
                echo "   Aucun vieux backup trouvé"
            else
                echo ""
                echo "Backups de plus de 30 jours:"
                echo "$OLD_BACKUPS" | while read file; do
                    SIZE=$(du -h "$file" | cut -f1)
                    echo "   - $(basename "$file") - $SIZE"
                done
                
                echo ""
                read -p "Supprimer ces backups? (y/n): " CONFIRM
                
                if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
                    echo "$OLD_BACKUPS" | xargs rm -f
                    echo "✅ Vieux backups supprimés"
                else
                    echo "Annulé"
                fi
            fi
            ;;
            
        6)
            # Statistiques
            echo ""
            echo "📊 Statistiques des Backups"
            echo "============================"
            echo ""
            
            if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
                echo "Aucun backup trouvé"
            else
                BACKUP_COUNT=$(ls -1 "$BACKUP_DIR" | wc -l)
                TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
                OLDEST=$(ls -tr "$BACKUP_DIR" | head -1)
                NEWEST=$(ls -t "$BACKUP_DIR" | head -1)
                
                echo "   Nombre total de backups: $BACKUP_COUNT"
                echo "   Taille totale: $TOTAL_SIZE"
                echo "   Plus ancien: $OLDEST"
                echo "   Plus récent: $NEWEST"
                echo ""
                echo "   Emplacement: $BACKUP_DIR"
            fi
            ;;
            
        7)
            # Quitter
            echo ""
            echo "👋 Au revoir!"
            exit 0
            ;;
            
        *)
            echo "❌ Choix invalide"
            ;;
    esac
done
