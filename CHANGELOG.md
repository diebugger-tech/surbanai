# Changelog

All notable changes to this project will be documented in this file.

## [1.4.0] - 2026-05-12
### Added
- Global Rebranding: Surbanai/SurKAi → **KAiOSS**
- Interactive Multi-Colored KAiOSS Logo with segment-hover effects
- KAi AI Assistant (Ollama integration with streaming)
- Obsidian Vault → SurrealDB Wiki Sync (File System Access API + Legacy Fallback)
- Command Palette (Ctrl+K) with global search (Wiki + Projects)
- Terminal Log Panel for live database event tracking
- Auto-Save in DetailPanel with visual feedback
- SurrealDB Server-Side Events (auto_updated timestamp + Audit Trail)

### Changed
- Board.jsx refactor (extracted from App.jsx) with Ghost Drop Indicator
- useWikiStats hook to prevent memory leaks in live subscriptions
- Normalized database namespace and database name to `kaioss`

## [1.2.1] - 2026-05-11
### Added
- Integrated Wiki/Help Panel with sidebar navigation
- Keyboard Shortcuts (? for Wiki, ESC to close panels)
- Toast Notifications for save/error actions
- Loading Skeleton animations for DB connection
- Terminal-style empty column placeholders (> NO TASKS)

### Changed
- Refactored header into modular Navbar component
- Improved Drag & Drop reliability with RecordID safety check

## [1.2.0] - 2026-05-10
### Added
- Dark/Light Theme Toggle (thanks @Keerthi7423)
- localStorage theme persistence
- SurKAi branding with color-coded logo
- sur·ban·ai name explanation in header and footer

### Changed
- Renamed project from surreal-board to SurKAi
- SurKAi = surreal + kanban + ai

## [1.1.0] - 2026-05-10
- DetailPanel mit Inline-Editing
- Copy-to-clipboard Commands
- Component Refactor (Clean Architecture)
- sync-projects.sh + .project.toml

## [1.0.0] - 2026-05-10
- Initial Release
- SurrealDB Realtime Backend
- Drag & Drop Kanban
- Terminal Dark Theme

