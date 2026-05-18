#!/usr/bin/env bash
# db_reset.sh - Komplettes Wipen und neu seeden der Demo-Datenbank mit dreistufigem Safety Guard
# Part of KAiOSS Demo Setup | NixOS compatible

NS=${VITE_SURREAL_NS:-demo}
DB=${VITE_SURREAL_DB:-demo}

# Safety Guard 1: Production-Namespace blockieren
if [ "$NS" = "kaioss" ] || [ "$NS" = "kanban" ] || [ "$NS" = "pflanternen" ]; then
  echo "❌ FEHLER: Reset auf Namespace '$NS' ist nicht erlaubt!"
  echo "   Nur der 'demo' Namespace kann zurückgesetzt werden."
  exit 1
fi

# Safety Guard 2: Explizite Bestätigung
echo "⚠️  WARNUNG: Diese Aktion löscht ALLE Daten im Namespace '$NS' / DB '$DB'!"
echo "   Deine echten Projektdaten bleiben unberührt (anderer Namespace)."
echo ""
read -p "   Fortfahren? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "❌ Abgebrochen."
  exit 0
fi

# Safety Guard 3: Audit-Logging
LOG_DIR="/home/andreas/Projekte/aktiv/KAiOSS/logs"
mkdir -p "$LOG_DIR"
echo "[$(date)] db-reset ausgeführt auf NS=$NS DB=$DB" >> "$LOG_DIR/db-operations.log"

echo "🗑️  Setze '$NS/$DB' zurück..."
surreal sql --endpoint ws://localhost:8000 \
    --username root --password root \
    --namespace "$NS" --database "$DB" \
    --hide-welcome <<< "REMOVE DATABASE $DB;"

# Seed Script ausführen
bash db_seed.sh
