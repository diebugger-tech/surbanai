# KAiOSS TODO

---

## Sofort — Phase 1

- [ ] **models.config.js** erstellen
      Zentrales Modell-Routing: Ollama / Claude API / Gemini / Groq / Mistral
      Jedes Modell mit DSGVO-Klassifizierung (green/yellow/red)

- [ ] **DSGVO-Farbkodierung im Modell-Dropdown**
      🟢 Lokal (Ollama) — kein Datentransfer, immer sicher
      🟡 USA (Claude / Gemini / Groq / OpenAI) — DPF-zertifiziert, Drittlandtransfer
      🔴 China API (Qwen / DeepSeek / GLM) — kein DPF, Datenweitergabe gesetzlich verpflichtend
      Tooltip bei Auswahl: kurze Erklärung was das bedeutet

- [ ] **Dynamic Wiki**
      `wiki` Tabelle in SurrealDB anlegen
      Felder: `projekt, typ, titel, inhalt, status, priorität, erstellt, geändert`

- [ ] **TodoPanel**
      Floating draggable Modal, T-Shortcut oder Navbar-Button
      Filter-Tabs: Alle / SurKAi / KAi
      Inline-Add, LIVE SELECT

- [ ] **Backup-Button (💾)**
      fetch() → http://localhost:8000/export mit Basic Auth
      Download als timestamped `.surql`
      `make db-backup` Makefile-Eintrag

- [ ] **Shortcuts-Dokumentation** im Wiki aktualisieren

---

## Nächste Woche — Phase 2

- [ ] **Goose installieren** (NixOS)
- [ ] **ROCm aktivieren** für RX 7600
- [ ] **Goose ↔ Ollama** verbinden
- [ ] **SurrealDB MCP-Server** testen mit Goose
- [ ] **task_queue** + **agent_log** Schema anlegen

- [ ] **Claude API — Option A**
      "Ask Claude" Button in KAiOSS
      SurrealDB-Kontext im Prompt
      UI-Warnung: "🟡 Daten werden an Anthropic (USA) übertragen"

- [ ] **SurrealDB MCP-Server — Option B**
      Lokaler MCP-Server der SurrealDB exposed
      claude.ai kann Projekte, Tasks, Wiki, TODOs direkt lesen

---

## Später — Phase 3 & 4

- [ ] Master-Agent Orchestrierung via GUI
- [ ] Pipeline: Researcher → Coder → Reviewer
- [ ] goose_spawn MCP-Tool
- [ ] DSGVO Art. 17 — Löschung via UI
- [ ] DSGVO Art. 20 — Datenexport JSON/SURQL
- [ ] Zugriffskontrolle pro Eintrag

---

## UI/UX Backlog (Bestand)

### Hoch
- [ ] **Auto-Save im DetailPanel** — debounced 500ms, kein manuelles [SAVE] mehr
- [ ] **Projekt-Archivierung** statt Hard Delete — SET status = "archived" + Archiv-Column
- [ ] **Undo-Toast nach Delete** — 5s Fenster zum Rückgängigmachen

### Mittel
- [ ] **Bulk-Status-Change** — Shift+Klick mehrere Karten → gemeinsam Status ändern
- [ ] **Projekt-Priorität** — priority: 1–5 Feld + sortierbare Spalten
- [ ] **RELATE für Abhängigkeiten** — projekt:a →depends_on→ projekt:b im DetailPanel

### SurrealDB Native
- [ ] **Multi-User Presence** — LIVE SELECT auf presence-Table, Avatare in Navbar
- [ ] **Activity Feed** — audit-Table als Timeline-Sidebar

---

## ✅ Erledigt (Auszug)
- [x] Rebranding: Surbanai/SurKAi → **KAiOSS**
- [x] Integriertes Wiki-Panel mit Sidebar
- [x] updated Timestamp via time::now() server-seitig
- [x] Doppelte db.live('wiki') Subscription gefixt

---

## 🏆 ENDGEGNER (Langzeitvision)

> Kein Sprint. Der Nordstern.

- [ ] **[#99] Master-Agent** — KAi plant, delegiert, reviewt autonom
  - Approval-Gate für DELETE/Schema-Änderungen (nie bypass-bar)
  - Kill-Switch: Mensch kann immer eingreifen
- [ ] **[#100] AI-OS** — KAiOSS als Betriebssystem für AI-Agenten
  - SurrealDB = Vault, KAi = Kernel, Sub-Agenten = Apps
  - Zero-Cloud-Mode, DSGVO-konform, Plugin-System
