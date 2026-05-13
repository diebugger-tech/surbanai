# KAiOSS Roadmap

---

## Phase 1 — Core Stability (v1.4 / v1.5)

- [x] Streaming (stream: true + ReadableStream)
- [x] Download-Progress via /api/pull (ASCII Progress-Bar)
- [ ] models.config.js — zentrales Modell-Routing (Claude / Gemini / Groq / Ollama)
- [ ] **DSGVO-Farbkodierung im Modell-Dropdown**
      🟢 Lokal (Ollama) — kein Datentransfer
      🟡 USA (Claude / Gemini / Groq / OpenAI) — DPF-zertifiziert
      🔴 China (Qwen API / DeepSeek API / GLM) — kein DPF, kritisch
- [ ] Dynamic Wiki — Panel lädt aus SurrealDB `wiki` Tabelle
- [ ] TodoPanel — floating modal, T-Shortcut, Projekt-Filter-Tabs
- [ ] Backup-Button (💾) — fetch() → /export, timestamped .surql
- [ ] Shortcuts-Seite im Wiki aktualisieren
- [ ] Chat-History in SurrealDB speichern
- [ ] Remote Sync — explizit opt-in, nie automatisch

---

## Phase 2 — Agent Foundation + Claude Integration (v2.0)

- [ ] Goose auf NixOS installieren + konfigurieren
- [ ] ROCm für RX 7600 in NixOS aktivieren
- [ ] Goose ↔ Ollama verbinden (Qwen2.5-Coder:7b als default)
- [ ] SurrealDB MCP-Server für Goose-Zugriff
- [ ] `task_queue` Schema (status: pending/in_progress/done)
- [ ] `agent_log` Schema (agent, task, output, timestamp)
- [ ] Per-Projekt Goose-Sessions mit projektspezifischem System-Prompt
- [ ] **Claude API Integration Option A** — KAiOSS → Anthropic API
      SurrealDB-Kontext im Prompt, Antwort im KAi-Panel
      API Key in localStorage, Warnung: Daten verlassen Gerät (🟡)
- [ ] **SurrealDB MCP-Server Option B** — claude.ai → SurrealDB direkt
      Projekte, Tasks, Wiki, TODOs direkt lesbar
      Kein manuelles Copy-Paste von Kontext nötig

---

## Phase 3 — Multi-Agent Orchestration via GUI (v2.0)

- [ ] Master-Agent Prompt (Qwen2.5:32b, Orchestrator-Rolle)
- [ ] MCP-Tool: `goose_spawn` — startet Goose Sub-Sessions programmatisch
- [ ] Sequenzielle Pipeline:
      Researcher (Qwen2.5:7b) → Coder (Qwen2.5-Coder:7b) → Reviewer (gemma3:12b)
- [ ] GUI: "▶ Start Agent Pipeline" Button pro Projekt
- [ ] Pipeline-Status Panel (LIVE SELECT auf task_queue)
- [ ] agent_log Panel in KAiOSS Dashboard
- [ ] Fehlerbehandlung: rejected Tasks → zurück in Queue mit Kontext

---

## Phase 4 — AI-OS + DSGVO-Compliance (v3.0)

- [ ] Per-Projekt isolierte Agent-Workspaces (SurrealDB Namespaces)
- [ ] KAi Memory: Agent-Kontext persistiert zwischen Sessions
- [ ] Multi-Model Routing per Task-Typ (lokal vs. Cloud dynamisch)
- [ ] **DSGVO Art. 17** — Recht auf Löschung: eigene Daten löschbar via UI
- [ ] **DSGVO Art. 20** — Datenportabilität: Export als JSON/SURQL
- [ ] Zugriffskontrolle: `privat | team | öffentlich` per Eintrag
- [ ] Multi-User (Team-Modus, SurrealDB DEFINE SCOPE)
- [ ] Community Release
- [ ] SurrealDB Showcase Einreichung

---

## Phase ∞ — ENDGEGNER 🏆
**Ziel:** KAiOSS als vollständiges AI-OS  
**Status:** Horizon — kein Datum, aber klare Richtung

### Meilenstein A: Master-Agent (Issue #99)
- KAi plant und delegiert autonom
- Approval-Gate für destruktive Aktionen
- Sub-Agenten-Architektur produktiv

### Meilenstein B: AI-OS (Issue #100)  
- Plugin-System für neue Agenten
- Zero-Cloud vollständig
- API für externe Tool-Integration
- SurrealDB als universeller Agent-Vault

### Was Phase ∞ NICHT ist:
- Kein SaaS — KAiOSS bleibt lokal-first
- Kein AGI — KAi orchestriert, denkt nicht für den Menschen
- Kein Vendor Lock-in — jedes Modell, jeder Anbieter
