#!/usr/bin/env bash
# db_seed.sh - Initialisiert das Schema und importiert die Demo-Daten
# Part of KAiOSS Demo Setup | NixOS compatible

NS=${VITE_SURREAL_NS:-demo}
DB=${VITE_SURREAL_DB:-demo}

echo "🧹 Initialisiere Schema im Namespace '$NS'..."
curl -s -X POST \
    -u "root:root" \
    -H "Accept: application/json" \
    -H "Surreal-NS: $NS" \
    -H "Surreal-DB: $DB" \
    --data-binary "@src/db/init_clean.surql" \
    "http://localhost:8000/sql" > /dev/null

echo "🌱 Importiere Demo-Daten in Namespace '$NS'..."
curl -s -X POST \
    -u "root:root" \
    -H "Accept: application/json" \
    -H "Surreal-NS: $NS" \
    -H "Surreal-DB: $DB" \
    --data-binary "@db/seed.surql" \
    "http://localhost:8000/sql" > /dev/null

echo "✅ Demo-Daten erfolgreich in '$NS' geladen!"
