#!/bin/bash
# Database backup script — pg_dump + rclone to object storage
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="/tmp/pod-pg-${TIMESTAMP}.sql.gz"

pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"

rclone copy "$BACKUP_FILE" "pod-backups:postgres/${TIMESTAMP}/"
rm "$BACKUP_FILE"

echo "Backup complete: pod-backups:postgres/${TIMESTAMP}/"
