# KAiOSS TODO

## ✅ Erledigt
- [x] Dark/Light Theme Toggle (Keerthi7423)
- [x] README Screenshots
- [x] AGENTS.md
- [x] SurrealDB Awesome-Liste PR (#115)
- [x] Repo public auf GitHub
- [x] Detail Panel mit Inline-Editing
- [x] Component Refactor (Clean Architecture)
- [x] sync-projects.sh + .project.toml
- [x] **v1.2.1 UX & Wiki Update**
  - [x] Keyboard Shortcuts (ESC = Panel schließen, ? = Wiki)
  - [x] Toast Notifications bei Save/Error
  - [x] Loading Skeleton beim DB-Connect
  - [x] Leere Spalten besser darstellen (NO TASKS)
  - [x] Integriertes Wiki-Panel mit Sidebar
  - [x] Rebranding: Surbanai/SurKAi → **KAiOSS** (Final)

## v1.3 — Core CRUD
- [ ] [+] NEW_PROJECT Button im Header
- [ ] ProjectCreation Modal (name, status, icon)
- [ ] Delete Button im DetailPanel mit Bestätigung
- [ ] path Feld in .project.toml → Auto cd + cmd beim Kopieren
- [ ] Markdown-Support für Projekt-Beschreibungen

## v1.4 — SurrealDB Power Features
- [ ] Audit-Log via DEFINE EVENT → projekt_history
- [ ] History Tab im DetailPanel
- [ ] Projekt-Relationen via Graph Edges (RELATE)
- [ ] Offline Fallback (localStorage Sync)
- [ ] Multi-Namespace Switcher

## v1.5 — Terminal UX & Automation
- [ ] Quick Search via / Taste (Fuzzy Search)
- [ ] Quick-Run Icon direkt auf Karte
- [ ] .project.toml Auto-Sync (Watcher)
- [ ] Glassmorphism & Glow Animationen
- [ ] Deep-Link zu VSCode (vscode://...)

## v2.0 — Desktop & Integrations
- [ ] Tauri Desktop App (Rust Backend)
- [ ] GitHub Issues Sync
- [ ] Webhooks bei Status-Änderung
- [ ] Export als JSON/CSV

## v2.1 — Hermes / AI OS
- [ ] Bidirektionaler Sync: Hermes Tasks ↔ SurrealDB ↔ surbanai
- [ ] surbanai als visuelles Frontend für Hermes-Tasks
- [ ] Obsidian Vault → SurrealDB Bridge
- [ ] TODOs in Obsidian → surbanai Karten
- [ ] Kollektives AI-Gehirn via SurrealDB

---

## v1.3.1 — Bug Fixes & Refactoring _(2026-05-12)_
- [x] **Doppelte `db.live('wiki')` Subscription gefixt** → `useWikiStats` Hook (Memory Leak)
- [x] **`updated` Timestamp** via `time::now()` server-seitig (DetailPanel + Drag&Drop)
- [x] **SDK-Response Normierung** in `useWikiStats`
- [x] **SurrealDB Events Setup-Script** erstellt (`scripts/setup-db-events.surql`)
- [ ] SurrealDB EVENT Script einmalig auf DB ausführen
- [ ] **Reconnect-Logik** in `useSurrealDB` — exponential backoff bei DB-Ausfall

## Neue Features (priorisiert)

### Hoch
- [ ] **Auto-Save im DetailPanel** — debounced 500ms, kein manuelles `[SAVE]` mehr
- [ ] **Projekt-Archivierung** statt Hard Delete — `SET status = "archived"` + Archiv-Column
- [ ] **Undo-Toast nach Delete** — 5s Fenster zum Rückgängigmachen

### Mittel
- [ ] **Bulk-Status-Change** — Shift+Klick mehrere Karten → gemeinsam Status ändern
- [ ] **Projekt-Priorität** — `priority: 1–5` Feld + sortierbare Spalten
- [ ] **`RELATE` für Abhängigkeiten** — `projekt:a →depends_on→ projekt:b` im DetailPanel

### SurrealDB Native
- [ ] **Multi-User Presence** — `LIVE SELECT` auf `presence`-Table, Avatare in Navbar
- [ ] **Activity Feed** — `audit`-Table als Timeline-Sidebar
