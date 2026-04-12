#!/bin/bash
BACKUP_DIR="/home/grassa/plateforme_electronique_k8s/backup_bd"
LOG="/home/grassa/plateforme_electronique_k8s/backup_bd/backup-cron.log"
cd /home/grassa/plateforme_electronique_k8s
# Lancer le backup
echo "y" | ./BACKUP-DATABASE.sh >> "$LOG" 2>&1
# Purge — garde les 3 derniers de chaque type
ls -t "$BACKUP_DIR"/backup-invoice_db-*.sql.gz 2>/dev/null | tail -n +4 | xargs -r rm -fv >> "$LOG" 2>&1
ls -t "$BACKUP_DIR"/backup-ALL-DATABASES-*.sql.gz 2>/dev/null | tail -n +4 | xargs -r rm -fv >> "$LOG" 2>&1
echo "[$(date '+%Y-%m-%d %H:%M')] Backup + purge terminés" >> "$LOG"
