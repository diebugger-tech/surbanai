# KAiOSS — Meilensteine & Roadmap

> Letztes Update: 2026-05-12

---

## Meilenstein v1.3 — Stabil ✅

- [x] Drag & Drop Fix (RecordID toString)
- [x] Wiki ID-Fix (0% Project Pulse Bug)
- [x] Wiki Daten in SurrealDB (Seed)
- [x] Wiki Auto-Sync DB Event
- [x] TodoPanel + Snap-Points + Collapse
- [x] Backup Terminal-Log
- [x] System-Manifest pro Projekt
- [x] TODO-Progress Kanban-Balken

---

## Meilenstein v1.4 — Fertig ✅

### Board Refactor
- [x] Board.jsx neu erstellen (aus App.jsx extrahieren)
- [x] dropTarget State global (Vorbereitung v1.5 Cross-Column Reorder)

### Ghost Drop Indicator
- [x] getInsertIndex mit useCallback
- [x] Ghost-Karte mit slideIn Animation
- [x] Edge-Case: leere Spalten
- [x] data-card Attribut in KanbanCard

### KAi Wiki-Search (Cmd+K)
- [x] Wiki-Ergebnisse in Command Palette
- [x] `[DOC]` `[BUG]` `[TODO]` Badges Terminal-Style
- [x] KAi Fallback wenn keine Treffer (Ollama)
- [x] CONTEXT_CHAR_LIMIT = 2000
- [x] Terminal Loader "denkt nach... █▒▒"
- [x] scrollToEntry in WikiPanel (auto page-switch)

### Obsidian Sync
- [x] Obsidian Vault → SurrealDB Sync Button (`🔮` in Navbar)
- [x] File System Access API (kein Backend nötig)
- [x] `#kaioss` Tag-Filter (konfigurierbar)
- [x] UPSERT (kein Duplikat-Problem)
- [x] Progress-Bar + Live-Log

### UX
- [x] Auto-Save im DetailPanel (500ms Debounce)
- [x] `isDirty` Ref verhindert Save beim initialen Load
- [x] `[ AUTO_SAVING... ]` / `[ ✓ SAVED ]` Button-Feedback

---

## Meilenstein v1.5 — Geplant 📋

### Multi-Model KAi Hub
- [ ] `models.config.js` (Claude, Gemini, Groq, Ollama, OpenRouter)
- [ ] `kai.api.js` — Unified API Handler
- [ ] `KAiSettings.jsx` — API Keys + Kontext-Tiefe (localStorage)
- [ ] Model Dropdown im KAi-Panel
- [ ] `chat_history` Tabelle in SurrealDB
- [ ] `loadKontext()` aus Wiki + History
- [ ] Jede Antwort in `chat_history` speichern

### Remote Sync
- [ ] Remote DB URL in Settings
- [ ] `chat_history` + `wiki` Export als `.surql`
- [ ] Import auf anderem Gerät
- [ ] Von zuhause weiterarbeiten

### Chat-History Import
- [ ] Claude JSON Export parsen
- [ ] Gemini Export parsen
- [ ] KAi fasst automatisch zusammen → Wiki-Eintrag

### UX
- [ ] Ghost Drop zwischen Spalten (Cross-Column Reorder)
- [ ] `useDebounce` Hook extrahieren
- [ ] SVG Icons für Wiki-Typen
- [ ] Suchbegriff-Highlighting im Wiki

---

## Meilenstein v2.0 — Vision 🚀

### Zugriffskontrolle
- [ ] `sichtbarkeit` Flag pro Chat-Eintrag (`privat | team | öffentlich`)
- [ ] `DEFINE SCOPE` in SurrealDB
- [ ] User-basierte Zugriffskontrolle

### Community
- [ ] GitHub README finalisieren
- [ ] SurrealDB Showcase einreichen
- [ ] Demo-Video
- [ ] Contributions Guide

### Multi-User
- [ ] Team-Modus
- [ ] Geteilte Projekte
- [ ] Rollen (Admin, Member, Viewer)

---

## Rebranding SurKAi → KAiOSS
- [x] App-Titel + Logo im Frontend ändern
- [x] Terminal Log: `> kaioss::ready`
- [x] DB Namespace: `kaioss`
- [x] Backup-Dateiname: `kaioss_backup.surql`
- [x] GitHub Repo umbenennen (surbanai → kaioss)
- [x] SurrealDB Einreichung aktualisieren
