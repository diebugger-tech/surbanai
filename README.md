> AI-native project hub — Kanban, Wiki, Multi-Model KAi, powered by SurrealDB + React

![SurrealDB](https://img.shields.io/badge/SurrealDB-2.3.10-ff00a0?style=for-the-badge&logo=surrealdb)
![React 18](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite)
![License](https://img.shields.io/badge/License-Apache_2.0-blue?style=for-the-badge)

```
> kaioss --version 1.4.0
> kaioss::ready
```

---

## Vision

KAiOSS ist mehr als ein Kanban-Tool. Es positioniert sich als **"Brain for Developers"**: Local-First, IaC-basiert (NixOS), Hardware-Bridge (MCP), Offline-fähig und Silicon-unabhängig.

Die Idee: **Alle KI-Chats und Projektdaten gebündelt in einer einzigen SurrealDB** — lokal, privat, unter deiner Kontrolle.

Claude, Gemini, Perplexity, OpenAI, Groq, Ollama — jedes Gespräch, jede Entscheidung, jeder Plan wird in deiner eigenen Datenbank gespeichert. KAiOSS wird zur zentralen Schaltzentrale für KI-gestütztes Arbeiten.

```
Claude ──┐
Gemini ──┤
Groq   ──┼──→ KAiOSS DB (SurrealDB) ──→ Projekte
Ollama ──┤                               Wiki
OpenAI ──┘                               Chat-History
                                         TODOs
                                         Agent-Log
```

---

## Kernprinzipien

- **Lokal first** — alle Daten bleiben auf deinem Gerät
- **Open Source** — Apache 2.0, Community-ready
- **Model-agnostisch** — kein Lock-in auf einen Anbieter
- **Privacy by Design** — API Keys nur in localStorage, nie in der DB
- **SurrealDB** — eine DB für alles: Relationen, Live Queries, Realtime

---

## Stack

| Layer | Technologie |
|-------|-------------|
| Frontend | React 18 + Vite 6 |
| Datenbank | SurrealDB 2.3.x |
| KAi Engine | Claude / Gemini / Groq / Ollama / OpenRouter |
| Agent | Goose + OpenCode |
| Styling | CSS Variables, Terminal-Ästhetik |

---

## Features

### v1.3 — Stabil ✅
- Kanban Board mit Drag & Drop
- Wiki Panel (dynamisch aus SurrealDB)
- TodoPanel mit Snap-Points
- Backup Export (Terminal-Log)
- Wiki Auto-Sync bei neuen Projekten
- System-Manifest pro Projekt
- TODO-Progress Kanban-Balken

### v1.4 — Aktuell 🔄
- Ghost Drop Indicator
- Board.jsx Refactor (globaler dropTarget State)
- KAi Wiki-Search in Cmd+K mit `[DOC]`/`[BUG]`/`[TODO]` Badges
- KAi Fallback via Ollama wenn keine Wiki-Treffer
- Obsidian Vault → SurrealDB Sync Button (File System Access API)
- Auto-Save im DetailPanel (500ms Debounce)
- Streaming (stream: true + ReadableStream)
- Download-Progress via /api/pull (ASCII Progress-Bar im Chat)

### v1.5 — Geplant 📋
- Multi-Model KAi Hub (Claude, Gemini, Groq, Ollama)
- models.config.js (zentrales Modell-Routing mit DSGVO-Klassifizierung)
- DSGVO-Farbkodierung im Modell-Dropdown (🟢 lokal / 🟡 USA / 🔴 China)
- Chat-History in SurrealDB
- Remote DB Sync (opt-in, explizit)
- Chat-History Import (Claude/Gemini JSON Export)
- Ghost Drop zwischen Spalten
- Suchbegriff-Highlighting im Wiki

### v2.0 — Agent Orchestration + Claude MCP 🤖
- Claude API Integration direkt in KAiOSS (Planungs-Agent)
- SurrealDB MCP-Server → Claude liest Projekte, Tasks, Wiki direkt
- Master-Agent (Qwen2.5:32b) orchestriert Sub-Agenten via GUI:
  ```
  Task (SurrealDB)
    → Researcher Agent (Qwen2.5:7b)
    → Coder Agent (Qwen2.5-Coder:7b)
    → Reviewer Agent (gemma3:12b)
    → Status: DONE
  ```
- GUI-Button "▶ Start Agent Pipeline" pro Projekt
- LIVE SELECT auf task_queue → Echtzeit-Pipeline-Status
- agent_log Panel (wer hat was wann gemacht)
- MCP-Tool: goose_spawn (startet Goose Sub-Sessions programmatisch)
- Per-Projekt isolierte Agent-Workspaces

### v3.0 — Vision 🚀
- Zugriffskontrolle (`privat | team | öffentlich`)
- Recht auf Löschung via UI (DSGVO Art. 17)
- Datenexport eigener Daten (DSGVO Art. 20)
- Multi-User (Team-Modus)
- Community Release
- SurrealDB Showcase Einreichung

---

## Agent-Architektur (v2.0)

```
KAiOSS Dashboard
    └── triggert Master-Agent (Goose + Qwen2.5:32b)
            ├── liest pending Tasks aus SurrealDB via MCP
            ├── entscheidet: welcher Sub-Agent für welchen Task
            ├── spawnt Goose Sub-Session
            ├── schreibt Ergebnis zurück in SurrealDB
            └── wiederholt bis Queue leer

Claude Integration (zwei Modi):
  A) API-Modus: KAiOSS → Anthropic API (mit DB-Kontext im Prompt)
  B) MCP-Modus: claude.ai → MCP-Server → SurrealDB (direkter DB-Zugriff)

SurrealDB Vault
  ├── task_queue   (status: pending/in_progress/done)
  ├── agent_log    (agent, task, output, timestamp)
  ├── projects     (agent workspaces)
  └── wiki         (agent knowledge base)
```

**Modell-Split:**

| Agent | Modell | RAM |
|---|---|---|
| Master | Qwen2.5:32b (Q4) | ~20 GB |
| Researcher | Qwen2.5:7b | ~5 GB |
| Coder | Qwen2.5-Coder:7b | ~5 GB |
| Reviewer | gemma3:12b | ~8 GB |

---

## DSGVO & Datenschutz

KAiOSS ist **Lokal-first** — aber nicht alle Modelle sind gleich sicher.

### Modell-Klassifizierung

| Modell | Anbieter | Sitz | DPF | DSGVO |
|--------|----------|------|-----|-------|
| Ollama (lokal) | — | Lokal | — | 🟢 kein Risiko |
| Qwen2.5 (lokal) | — | Lokal | — | 🟢 kein Risiko |
| DeepSeek (lokal) | — | Lokal | — | 🟢 kein Risiko |
| Mistral API | Mistral AI | 🇫🇷 EU | ✅ | 🟢 niedrig |
| Claude API | Anthropic | 🇺🇸 USA | ✅ | 🟡 mittel |
| Gemini API | Google | 🇺🇸 USA | ✅ | 🟡 mittel |
| Groq API | Groq | 🇺🇸 USA | ✅ | 🟡 mittel |
| OpenAI API | OpenAI | 🇺🇸 USA | ✅ | 🟡 mittel |
| Qwen API | Alibaba | 🇨🇳 China | ❌ | 🔴 kritisch |
| DeepSeek API | DeepSeek | 🇨🇳 China | ❌ | 🔴 kritisch |
| GLM / Zhipu API | Zhipu AI | 🇨🇳 China | ❌ | 🔴 kritisch |

> ⚠️ **Wichtig:** Lokale Modelle (Ollama) sind immer 🟢 — unabhängig vom Modell-Ursprung.
> Die Klassifizierung gilt nur für **API-Aufrufe** an externe Server.
> Chinesische Anbieter unterliegen dem chinesischen Datensicherheitsgesetz —
> Datenweitergabe an Behörden ist gesetzlich verpflichtend, kein DPF möglich.

### Was KAiOSS speichert

```
localStorage  → API Keys (nur lokal, nie übertragen, nie in DB)
SurrealDB     → Chat-History, Wiki, Projekte, TODOs, Agent-Log
Remote Sync   → optional, explizit opt-in, nie automatisch
```

### Was das Gerät verlässt (bei Cloud-Modellen)

Wenn du ein Cloud-Modell (🟡 / 🔴) nutzt, werden **Prompts und Kontext** an externe Server übertragen. KAiOSS zeigt dies im Modell-Dropdown durch Farbkodierung an.

### DSGVO-Rechte (v3.0)

- **Art. 17** — Recht auf Löschung: eigene Daten löschbar via UI
- **Art. 20** — Datenportabilität: Export aller eigenen Daten als JSON/SURQL

---

## Demo

```bash
make db-demo  # Startet mit Dummy-Daten im isolierten demo-Namespace
```

---

## Installation & Setup

KAiOSS verfügt über einen interaktiven Setup-Wizard, der das System konfiguriert und optionale Module erkennt.

```bash
git clone https://github.com/diebugger-tech/KAiOSS
cd KAiOSS

# Interaktives Setup starten (erkennt OS und Module)
make setup
```

### Module (Optional)

- **Pflanternen (NixOS-spezifisch)**:
  Dieses Modul wird unter NixOS automatisch zur Installation vorgeschlagen. Es bietet Systemdiagnosen und Git-Hook Telemetrie im Namespace `pflanternen`.
  
  Manuelle Aktivierung unter NixOS:
  1. `PFLANTERNEN_ENABLED=true` in `.env.local` eintragen.
  2. Datenbankschema laden: `make install-pflanternen`

### Umgebungsvariablen

Konfiguration in `.env` (oder überschrieben in `.env.local`):

```env
VITE_SURREAL_URL=ws://127.0.0.1:8000/rpc
VITE_SURREAL_USER=root
VITE_SURREAL_PASS=root
VITE_SURREAL_NS=kaioss
VITE_SURREAL_DB=kaioss
PFLANTERNEN_ENABLED=false
```

---

## Entwickelt mit

```
Planung       → Claude (Anthropic)
Code          → Gemini 2.5 Flash
Ausführung    → Goose + OpenCode
Reasoning     → Qwen3 32B (Groq)
```

---

## Verwandte Projekte

- [Pflanternen](https://github.com/diebugger-tech/Pflanternen)
  NixOS KI-Automatisierungsframework

---

## Contributing

KAiOSS ist Open Source (Apache 2.0).
Issues, PRs und Ideen sind willkommen.

Lies [`ROADMAP.md`](./ROADMAP.md) und [`TODO.md`](./TODO.md) für den aktuellen Entwicklungsstand.

---

*KAiOSS — KAi Open Source System, powered by SurrealDB*
