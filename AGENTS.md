# AI Agent Constraints & Architecture (KAiOSS)

> Global context and technical constraints for AI coding agents working on this repository.
> Repo: github.com/diebugger-tech/KAiOSS

## 🏗 Project Structure
- `src/components/`: Modular UI components (Columns, Cards, DetailPanel).
- `src/lib/db.js`: Centralized SurrealDB connection logic (Singleton).
- `src/hooks/`: Custom React hooks for data fetching and live updates.
- `src/App.jsx`: Main application orchestration.
- `system-check.sh`: Automated environment diagnostics.

## 👥 Agent-Orchester & Roster

Die KAiOSS-Plattform wird von einer Reihe spezialisierter KI-Agenten gesteuert, die über das **Model Context Protocol (MCP)** miteinander und mit dem System kommunizieren:

- **KAi (primär)**: Task-Reasoning, Planung und Code-Generierung.
- **LearnAgent**: Kontinuierliches Scannen von GitHub Trending, Hacker News und ArXiv.
- **GitAgent**: Event-driven Ausführung über Git-Hooks.
- **MarketAgent**: Periodische Markt- und Wettbewerbsanalysen.
- **SecurityAgent**: On-demand Sicherheits-Audits und Schwachstellen-Scans via MCP.

### ⚙️ Framework & Execution
- **Framework**: Goose + Ollama + Qwen2.5 (oder `qwen2.5:32b`).
- **NixOS-native Integration**: Ausführung als deklarative `systemd`-Services.
- **HITL-Prinzip (Human-in-the-Loop)**: Kritische Operationen (z. B. direkte DB-Resets, destructive system changes oder direkte Main-Pushes) werden **niemals ohne menschliche Freigabe** ausgeführt.

## 🤖 Critical Rules for Agents
1. **db.js is Singleton**: Do NOT initialize multiple connections. Use the shared instance.
2. **Environment Variables**: Access all configuration via `import.meta.env.VITE_*`.
3. **LIVE SELECT**: Always use Live Queries for real-time data synchronization.
4. **No Backend**: All logic is handled via frontend and SurrealDB. No custom API middleware.
5. **NixOS Compatibility**: All shell scripts must use `#!/usr/bin/env bash`.
6. **Code Style**: Functional React 18 components with Runes-like clarity (hooks).

## 🔧 Verification
- Verify changes using `npm run dev`.
- Ensure new features adhere to the terminal dark theme aesthetic.

