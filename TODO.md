# KAiOSS — TODOs

_Stand: 17.05.2026_

## Phase 1 — Foundation & Security

- [x] #25 Architektur-Review Workflow etablieren
- [x] #23 Task-Schema + useTaskDB + TodoPanel Migration
- [x] #16 Datensicherung mit Hash-Werten (sha256)
- [x] #30a Legacy Wiki-TODOs Migration (obsolet — keine Legacy-Daten)
- [x] #31 TODO.md → SurrealDB Sync (todo-sync.js)
- [ ] #3 Skill: kaioss-security (Architektur-Entwurf: Alias-Methode, Whitelist commands.json, NixOS Sandboxing via bubblewrap)
- [ ] #21 Human-in-the-Loop Konzept (HITL Bestätigung für kritische Befehle)

## Phase 2 — KAi Bootstrap

- [ ] #29 Agent-Priorisierung (KAi + LearnAgent + GitAgent)
- [ ] #7 Modell-Wahl für KAi (Qwen2.5-Coder vs qwen2.5:32b)
- [ ] #2 Skills erstellen (.kai/)
- [ ] #15 Modulare Prompt-Pipeline
- [ ] #8 KAi Priorisierungslogik
- [ ] #30b useTaskDB in DetailPanel integrieren
- [ ] #32 cmd-runner (Sicherer Hintergrund-Prozess-Executor auf Basis von #3 & #21)

## Phase 3 — Infrastruktur & Resilienz

- [ ] #19 SurrealDB als Event-Bus
- [ ] #4 Resilienz (Recovery, Locking)
- [ ] #22 Task-Verifikation + proaktives Review (Sandbox-NixOS-VM via Firecracker/crosvm als Spielbrett & Test-Environment)
- [ ] #11 NixOS-native Integration (agents.nix, Pflanternen Stufe 3: Automatische Build-Evaluation und VM-Checks)

## Phase 4 — Ecosystem & Expansion

- [ ] #13 Agent-Pipeline
- [ ] #18 Agent-Governance
- [ ] #17 LearnAgent Quellen
- [ ] #24 FalkorDB Phase 2 (CabellistPro)

## Phase 5 — Horizon

- [ ] #26 Fine-Tuning auf kai_log-Daten (Reinforcement Learning aus nixos_training_game Versuchen via Unsloth & Ollama)
- [ ] #28 Cognee-Trigger definieren
- [ ] #6 TUI evaluieren
- [ ] #9 Multi-User → GitHub Issue
- [ ] #10 Pi.dev evaluieren
- [ ] #14 Hermes Agent als Referenz
- [ ] #20 Skills als Nix-Flake-Outputs
- [ ] #30 Voice-Interface (Pipecat > LiveKit)
