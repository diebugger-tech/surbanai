#!/usr/bin/env bash
# KAiOSS Bubblewrap Sandbox Wrapper
# Usage: bwrap.sh "<vollständiger Befehl>" [<alias-key>]
#
# WICHTIG: Dieser Wrapper löst KEINE Aliase auf.
# security.js übergibt den fertigen Befehl als $1.
# Der optionale Alias-Key $2 dient nur dem Logging.
#
# Hinweis: Befehle mit "sandbox: false" in commands.json
# werden von cmd-runner.js DIREKT ausgeführt (nicht über dieses Skript).

set -euo pipefail

CMD="${1:?FEHLER: Kein Befehl übergeben. Aufruf: bwrap.sh '<cmd>' [<alias>]}"
ALIAS_KEY="${2:-unknown}"

# ---------------------------------------------------------------------------
# bwrap lokalisieren — NixOS-kompatibel
# Auf NixOS liegt bwrap im Nix-Store, nicht in /usr/bin
# ---------------------------------------------------------------------------
BWRAP=$(which bwrap 2>/dev/null || \
  find /nix/store -maxdepth 5 -name bwrap -type f -perm /111 2>/dev/null | head -1)

if [ -z "$BWRAP" ]; then
  echo "ERROR: bwrap nicht gefunden. Installiere bubblewrap (NixOS: environment.systemPackages = [ pkgs.bubblewrap ];)" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Sandbox ausführen
# ---------------------------------------------------------------------------
# Gebundene Pfade (alle read-only außer Daemon-Socket):
#   /nix/store          — alle Nix-Pakete (Laufzeitabhängigkeiten)
#   /run/current-system — aktuelle Systemgeneration (nixos-rebuild, journalctl usw.)
#   /etc                — SSL-Zertifikate, /etc/nixos Konfiguration (ro)
#   /nix/var/nix/daemon-socket — Nix-Daemon Kommunikation (für nixos-rebuild)
#
# Nicht gebunden (Absicht):
#   /home, /root, /tmp außerhalb der Sandbox — Dateisystem-Isolation
#   externes Netzwerk   — --unshare-all isoliert den Netzwerk-Namespace
#
# KNOWN LIMITATION:
#   nixos-rebuild switch/dry-activate benötigt nix-trusted-user Rechte.
#   Der sandboxierte Prozess läuft als UID 65534 (nobody). Falls der
#   ausführende User kein trusted-user ist, schlägt nixos-rebuild fehl.
#   Workaround: User zu nix.settings.trusted-users hinzufügen in /etc/nixos.

exec "$BWRAP" \
  --unshare-all \
  --unshare-user \
  --uid 65534 \
  --gid 65534 \
  --ro-bind /nix/store /nix/store \
  --ro-bind /run/current-system /run/current-system \
  --bind /nix/var/nix/daemon-socket /nix/var/nix/daemon-socket \
  --ro-bind /etc /etc \
  --tmpfs /tmp \
  --proc /proc \
  --dev /dev \
  --setenv PATH /run/current-system/sw/bin \
  --setenv HOME /tmp \
  --die-with-parent \
  --hostname kaioss-jail \
  -- /run/current-system/sw/bin/bash -c "$CMD"
