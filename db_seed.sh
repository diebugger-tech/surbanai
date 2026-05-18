#!/usr/bin/env bash
# db_seed.sh - Initialisiert das Schema und importiert die Demo-Daten
# Part of KAiOSS Demo Setup | NixOS compatible

NS=${VITE_SURREAL_NS:-demo}
DB=${VITE_SURREAL_DB:-demo}

echo "🧹 Initialisiere Schema im Namespace '$NS'..."
surreal import --endpoint ws://localhost:8000 \
    --username root --password root \
    --namespace "$NS" --database "$DB" \
    src/db/init_clean.surql

echo "🌱 Importiere Demo-Daten in Namespace '$NS'..."
surreal import --endpoint ws://localhost:8000 \
    --username root --password root \
    --namespace "$NS" --database "$DB" \
    db/seed.surql

echo "✅ Demo-Daten erfolgreich in '$NS' geladen!"
