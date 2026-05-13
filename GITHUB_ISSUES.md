# KAiOSS GitHub Issues

Bereit zum Anlegen auf github.com/diebugger-tech/surbanai

---

## Issue #1 — feat: models.config.js Multi-Model Routing
**Labels:** `enhancement` `phase-1`

Zentrale Konfigurationsdatei für Modell-Routing.
Unterstützt: Ollama (lokal), Claude API, Gemini, Groq, Mistral, OpenAI.
Jedes Modell trägt DSGVO-Klassifizierung: green / yellow / red.
KAiPanel.jsx liest aus dieser Config statt hardcoded Ollama-URL.

---

## Issue #2 — feat: DSGVO-Farbkodierung im Modell-Dropdown
**Labels:** `enhancement` `phase-1` `dsgvo`

Modell-Dropdown zeigt DSGVO-Status per Farbe:
- 🟢 Lokal (Ollama) — kein Datentransfer, immer sicher
- 🟡 USA (Claude / Gemini / Groq / OpenAI) — DPF-zertifiziert, Drittlandtransfer
- 🔴 China API (Qwen / DeepSeek / GLM) — kein DPF, chinesisches Datensicherheitsgesetz

Tooltip bei Hover/Auswahl: kurze Erklärung was der Status bedeutet.
Hinweis: Lokale Modelle (Ollama) sind immer 🟢 — unabhängig vom Modell-Ursprung.

---

## Issue #3 — feat: Dynamic Wiki from SurrealDB
**Labels:** `enhancement` `phase-1`

Wiki-Panel lädt Inhalte dynamisch aus SurrealDB `wiki` Tabelle.
Schema: `projekt, typ, titel, inhalt, status, priorität, erstellt, geändert`
Aktuell: statisch hardcoded (7 Seiten, Deutsch).

---

## Issue #4 — feat: TodoPanel floating modal
**Labels:** `enhancement` `phase-1`

Floating draggable Modal (nicht fullscreen).
Öffnen via T-Shortcut oder Navbar-Button.
Filter-Tabs: Alle / SurKAi / KAi.
Inline-Add, LIVE SELECT für live Updates.

---

## Issue #5 — feat: Backup Button (💾)
**Labels:** `enhancement` `phase-1`

Navbar-Button triggert fetch() auf http://localhost:8000/export mit Basic Auth.
Download als timestamped .surql Datei.
Makefile: `make db-backup` Eintrag.

---

## Issue #6 — feat: Claude API Integration (Option A)
**Labels:** `enhancement` `phase-2` `claude` `dsgvo`

"Ask Claude" Button in KAiOSS.
Schickt SurrealDB-Kontext (Projekte, Tasks, Wiki) als Prompt zur Anthropic API.
Antwort erscheint im KAi-Panel.
API Key in localStorage, nie in DB.
UI-Warnung bei Aktivierung: "🟡 Prompts werden an Anthropic (USA) übertragen."

---

## Issue #7 — feat: SurrealDB MCP-Server für claude.ai (Option B)
**Labels:** `enhancement` `phase-2` `claude` `mcp`

Lokaler MCP-Server der SurrealDB exposed.
claude.ai kann damit Projekte, Tasks, Wiki, TODO-Liste direkt lesen.
Kein manuelles Copy-Paste von Kontext nötig.
Basis für alle weiteren Agent-Integrationen.

---

## Issue #8 — feat: Goose Agent Foundation
**Labels:** `enhancement` `phase-2` `agent`

Goose auf NixOS installieren + konfigurieren.
ROCm für RX 7600 aktivieren (GPU-accelerated inference).
Goose ↔ Ollama (Qwen2.5-Coder:7b) verbinden.
SurrealDB MCP-Server für Goose-Zugriff.
task_queue + agent_log Schema anlegen.

---

## Issue #9 — feat: Multi-Agent Orchestration via GUI
**Labels:** `enhancement` `phase-3` `agent`

Master-Agent (Qwen2.5:32b) orchestriert Sub-Agenten.
Sequenzielle Pipeline: Researcher → Coder → Reviewer.
GUI-Button "▶ Start Agent Pipeline" pro Projekt.
LIVE SELECT auf task_queue → Echtzeit-Pipeline-Status im Dashboard.
agent_log Panel in KAiOSS.
MCP-Tool: goose_spawn (startet Goose Sub-Sessions programmatisch).

---

## Issue #10 — feat: DSGVO Art. 17 — Recht auf Löschung via UI
**Labels:** `enhancement` `phase-4` `dsgvo`

Nutzer kann eigene Daten (Chat-History, TODOs, Wiki-Einträge) vollständig via UI löschen.
SurrealDB DELETE-Query pro Datenkategorie.
Bestätigungsdialog vor destruktiver Aktion.

---

## Issue #11 — feat: DSGVO Art. 20 — Datenportabilität / Export
**Labels:** `enhancement` `phase-4` `dsgvo`

Nutzer kann alle eigenen Daten exportieren.
Format: JSON (lesbar) + SURQL (reimportierbar).
Export-Button in Einstellungen oder Backup-Panel.
Umfasst: Projekte, Tasks, Wiki, Chat-History, Agent-Log.

---

## 🏆 ENDGEGNER

> Diese Issues definieren den finalen Zustand von KAiOSS.
> Kein Sprint. Kein Milestone. Der Horizont.

---

### Issue #99 — ENDGEGNER: Master-Agent
**Status:** 🔴 open  
**Priorität:** VISION  
**Labels:** endgegner, agent, autonomy  
**Depends on:** #13, #14, #15, alle Agent-Issues

**Vision:**  
KAi ist kein Assistent mehr — er ist ein autonomer Master-Agent.
Er plant, delegiert, reviewt und schließt Tasks ohne menschlichen Input.
Der Mensch setzt Ziele. KAi findet den Weg.

**Fähigkeiten des Master-Agents:**

| Fähigkeit | Beschreibung |
|---|---|
| **Planung** | KAi zerlegt ein Ziel in Tasks und legt sie selbst an |
| **Delegation** | KAi weist Sub-Agenten (Coding, Research, Review) Tasks zu |
| **Execution** | KAi führt Tasks aus: Code schreiben, Wiki updaten, DB-Queries |
| **Review** | KAi bewertet eigene Ergebnisse und iteriert |
| **Approval-Gate** | Destruktive Aktionen (DELETE, Schema-Change) → immer menschliche Bestätigung |
| **Selbst-Optimierung** | KAi lernt aus kai_log welche Aktionen erfolgreich waren |

**Approval-Gate — die einzige Grenze:**
```
KAi will DELETE tasks WHERE status = 'erledigt'
→ UI zeigt: "KAi möchte 12 Tasks löschen. [Erlauben] [Ablehnen]"
→ Ohne Klick: Aktion wird nicht ausgeführt. Niemals.
```

**Architektur (Zielzustand):**
```
Mensch gibt Ziel ein
     ↓
Master-KAi (Goose + großes Modell)
     ├── Sub-Agent: Coding (Qwen2.5-Coder)
     ├── Sub-Agent: Research (Mistral/lokales Modell)
     ├── Sub-Agent: Review (KAi selbst)
     └── SurrealDB (via MCP) — einzige Wahrheitsquelle
```

**Akzeptanzkriterien:**
- [ ] KAi nimmt ein Ziel entgegen und erstellt eigenständig einen Task-Plan
- [ ] KAi delegiert Tasks an spezialisierte Sub-Agenten
- [ ] KAi reviewed Ergebnisse und iteriert ohne Human-Input
- [ ] Approval-Gate für alle destruktiven Aktionen — kein Bypass möglich
- [ ] kai_log zeigt vollständige Entscheidungskette
- [ ] Mensch kann jederzeit eingreifen und KAi stoppen (Kill-Switch)

---

### Issue #100 — ENDGEGNER: KAiOSS als AI-OS
**Status:** 🔴 open  
**Priorität:** VISION  
**Labels:** endgegner, platform, ai-os  
**Depends on:** #99 + alle anderen Issues

**Vision:**  
KAiOSS ist kein Kanban-Board mehr.
Es ist das Betriebssystem für AI-Agenten — "Obsidian for AI Agents".
SurrealDB ist der Vault. KAi ist der Kernel. Der Mensch ist der Architekt.

**Was AI-OS bedeutet:**

| Komponente | Analogie | KAiOSS |
|---|---|---|
| Vault | Obsidian Vault | SurrealDB (Graph + Docs) |
| Kernel | OS-Kernel | KAi Master-Agent |
| Apps | OS-Apps | Sub-Agenten (Coding, Research, ...) |
| Shell | Terminal | KAiPanel + kai_log |
| Filesystem | Dateisystem | Projekte + Tasks + Wiki |
| Permissions | UNIX chmod | SurrealDB PERMISSIONS |

**Fähigkeiten des AI-OS:**
- [ ] Multi-Agenten-Orchestrierung aus einer UI
- [ ] DSGVO-Klassifizierung aller genutzten Modelle (🟢/🟡/🔴)
- [ ] Lokale Datensouveränität — kein Cloud-Zwang
- [ ] Plugin-System: neue Agenten als "Apps" installierbar
- [ ] Export aller Daten (SURQL + JSON) — Art. 20 DSGVO
- [ ] API für externe Tools (n8n, Make, eigene Scripts)

**Akzeptanzkriterien:**
- [ ] Mindestens 3 spezialisierte Sub-Agenten produktiv
- [ ] Zero-Cloud-Mode vollständig funktional (100% lokal)
- [ ] Neuen Agenten in <30min integrierbar (Plugin-Standard)
- [ ] SurrealDB als einzige Wahrheitsquelle für alle Agenten
- [ ] KAi-Aktivitäten vollständig auditierbar (kai_log komplett)
