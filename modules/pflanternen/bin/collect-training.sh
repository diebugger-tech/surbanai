#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PFLANTERNEN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$PFLANTERNEN_DIR/logs"
mkdir -p "$LOG_DIR"
ERROR_LOG="$LOG_DIR/collect-errors.log"

exec 2>> "$ERROR_LOG"

COMMIT_MSG="${1:-"No commit message provided"}"
GIT_DIFF="${2:-""}"
HOST=$(hostname)
TIMESTAMP_ISO=$(date --iso-8601=seconds)

# Umgebungsvariablen laden
ENV_FILE="$SCRIPT_DIR/../../../.env"
ENV_LOCAL="$SCRIPT_DIR/../../../.env.local"
[ -f "$ENV_FILE" ] && export $(grep -v '^#' "$ENV_FILE" | xargs)
[ -f "$ENV_LOCAL" ] && export $(grep -v '^#' "$ENV_LOCAL" | xargs)

SDB_URL="${VITE_SURREAL_URL:-ws://localhost:8000/rpc}"
SDB_URL="${SDB_URL%/rpc}"
SDB_USER="${VITE_SURREAL_USER:-root}"
SDB_PASS="${VITE_SURREAL_PASS:-root}"
SDB_NS="pflanternen"
SDB_DB="diagnosen"

# Dry-activate ausführen
DRY_OUT_FILE=$(mktemp)
if sudo nixos-rebuild dry-activate --flake /etc/nixos &>"$DRY_OUT_FILE"; then
    DRY_OK=true
else
    DRY_OK=false
fi
DRY_OUT=$(cat "$DRY_OUT_FILE")
rm -f "$DRY_OUT_FILE"

# Failed Units prüfen
FAILED_UNITS_RAW=$(systemctl --failed --no-legend --no-pager | awk '{print $1}')
if [[ -z "${FAILED_UNITS_RAW}" ]]; then
    SERVICE_HEALTH=true
else
    SERVICE_HEALTH=false
fi

# Reward berechnen
if [ "$DRY_OK" = true ] && [ "$SERVICE_HEALTH" = true ]; then
    REWARD=1.0
else
    REWARD=-0.5
fi

# JSON-Payload bauen
JSON_PAYLOAD=$(jq -c -n \
    --arg ts "$TIMESTAMP_ISO" \
    --arg host "$HOST" \
    --arg task "$COMMIT_MSG" \
    --arg diff "$GIT_DIFF" \
    --argjson build_ok "$DRY_OK" \
    --arg logs "$DRY_OUT" \
    --argjson health "$SERVICE_HEALTH" \
    --argjson reward "$REWARD" \
    '{"timestamp": $ts, host: $host, task_description: $task, action_diff: $diff, build_success: $build_ok, error_logs: $logs, service_health: $health, reward: $reward}')

# "timestamp":"<date>" mit "timestamp":d"<date>" für SurrealDB datetime casting ersetzen
SDB_PAYLOAD=${JSON_PAYLOAD/\"timestamp\":\"$TIMESTAMP_ISO\"/\"timestamp\":d\"$TIMESTAMP_ISO\"}

# Query in ein temporäres File schreiben (printf %s verhindert Backslash-Interpretation)
TMP_QUERY=$(mktemp)
printf "CREATE nixos_training_game CONTENT %s;\n" "$SDB_PAYLOAD" > "$TMP_QUERY"

# Übertragung an SurrealDB via stdin-Redirect
SDB_RESPONSE=$(surreal sql --endpoint "$SDB_URL" --namespace "$SDB_NS" --database "$SDB_DB" --username "$SDB_USER" --password "$SDB_PASS" --hide-welcome < "$TMP_QUERY" 2>&1 || true)
rm -f "$TMP_QUERY"

# Fehler loggen falls Übertragung fehlgeschlagen
if [[ "$SDB_RESPONSE" == *"Parse error"* || "$SDB_RESPONSE" == *"Database error"* || "$SDB_RESPONSE" == *"Error:"* ]]; then
    echo "[$(date)] SurrealDB Error: $SDB_RESPONSE" >> "$ERROR_LOG"
fi
