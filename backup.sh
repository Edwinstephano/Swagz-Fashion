#!/bin/bash
# Swagz Fashion - Automated PostgreSQL Database Backup Script

BACKUP_DIR="/opt/projects/Swagz-Fashion/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/swagz_pos_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

echo "========================================================="
echo "  💾 Starting Swagz Fashion PostgreSQL Backup..."
echo "========================================================="

# Run pg_dump snapshot
PGPASSWORD="${POSTGRES_PASSWORD:-postgres}" pg_dump -h "${POSTGRES_HOST:-localhost}" -U "${POSTGRES_USER:-postgres}" -d swagz_pos -F c -b -v -f "$BACKUP_FILE" 2>/dev/null || \
pg_dump -U postgres -d swagz_pos > "$BACKUP_FILE" 2>/dev/null

if [ -f "$BACKUP_FILE" ]; then
    echo "✅ Backup successfully created: $BACKUP_FILE"
    # Retention Policy: Keep last 30 days of snapshots
    find "$BACKUP_DIR" -name "*.sql" -mtime +30 -exec rm {} \;
else
    echo "❌ Backup failed. Ensure PostgreSQL database is running."
fi
