#!/usr/bin/env bash
set -euo pipefail

detect_os() {
  if command -v nixos-rebuild &>/dev/null; then
    echo "nixos"
  elif [ "$(uname)" = "Darwin" ]; then
    echo "macos"
  elif [ -f /proc/version ] && grep -qi microsoft /proc/version; then
    echo "wsl"
  elif [ "$(uname)" = "Linux" ]; then
    echo "linux"
  else
    echo "unknown"
  fi
}

OS=$(detect_os)

# Idempotenz: .env.local nicht duplizieren, macOS-aware sed
set_env_local() {
  local key="$1" val="$2"
  if [ -f .env.local ] && grep -q "^${key}=" .env.local; then
    if [ "$(uname)" = "Darwin" ]; then
      sed -i '' "s|^${key}=.*|${key}=${val}|" .env.local
    else
      sed -i "s|^${key}=.*|${key}=${val}|" .env.local
    fi
  else
    echo "${key}=${val}" >> .env.local
  fi
}

# CI-Modus: kein TTY → nicht-interaktiv
is_interactive() { [ -t 0 ]; }

echo ""
echo "🚀 KAiOSS Setup"
echo "───────────────────────────────────────"

case "$OS" in
  nixos)
    echo "✅ Betriebssystem erkannt: NixOS"
    echo ""
    echo "Verfügbare Module:"
    echo "  [1] Pflanternen — NixOS Systemautomatisierung"
    echo "      (diagnose.sh, collect-training.sh, nixos-commands)"
    echo ""
    if is_interactive; then
      read -p "Pflanternen-Modul installieren? [Y/n]: " confirm
      confirm=${confirm:-Y}
    else
      confirm="Y"
      echo "CI-Modus: Pflanternen wird automatisch installiert."
    fi
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
      set_env_local "PFLANTERNEN_ENABLED" "true"
      make install-pflanternen
    else
      set_env_local "PFLANTERNEN_ENABLED" "false"
      echo "⏭️  Übersprungen — später: make install-pflanternen"
    fi
    ;;
  macos)
    echo "🍎 Betriebssystem erkannt: macOS"
    echo "  ⏭️  Pflanternen — nicht verfügbar (nur NixOS)"
    set_env_local "PFLANTERNEN_ENABLED" "false"
    echo "✅ KAiOSS läuft ohne Module vollständig auf macOS."
    ;;
  wsl)
    echo "🪟 Betriebssystem erkannt: Windows (WSL)"
    echo "  ⏭️  Pflanternen — nicht verfügbar (nur NixOS)"
    set_env_local "PFLANTERNEN_ENABLED" "false"
    echo "✅ KAiOSS läuft ohne Module vollständig unter WSL."
    ;;
  linux)
    echo "🐧 Betriebssystem erkannt: Linux"
    echo "  ⏭️  Pflanternen — nicht verfügbar (nur NixOS)"
    set_env_local "PFLANTERNEN_ENABLED" "false"
    echo "✅ KAiOSS läuft ohne Module vollständig."
    ;;
  *)
    echo "❓ Betriebssystem: unbekannt"
    set_env_local "PFLANTERNEN_ENABLED" "false"
    echo "✅ KAiOSS Core wird ohne Module installiert."
    ;;
esac

echo ""
echo "📦 npm Abhängigkeiten installieren..."
npm install
echo ""
echo "✅ KAiOSS Setup abgeschlossen!"
echo "   Starten mit: npm run dev"
echo "   Demo-Modus:  make db-demo"
echo ""
