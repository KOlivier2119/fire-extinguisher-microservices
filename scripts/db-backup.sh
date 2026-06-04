#!/bin/bash
# Backup all FEMS databases
set -e
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

PGHOST=${POSTGRES_HOST:-localhost}
PGPORT=${POSTGRES_PORT:-5432}
PGUSER=${POSTGRES_USER:-fems}

for DB in auth_db extinguisher_db notification_db; do
  echo "Backing up $DB..."
  PGPASSWORD=${POSTGRES_PASSWORD:-fems_password} pg_dump -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$DB" -F c -f "$BACKUP_DIR/${DB}.dump"
done

echo "Backup complete: $BACKUP_DIR"
