-- KAiOSS Demo-Daten (Isoliert im demo-Namespace)
USE NS demo DB demo;

-- =========================================================================
-- 1. PROJEKTE (Komplett getrennte Demo-Projekte, keine privaten Daten!)
-- =========================================================================
CREATE projekt:demo_kaioss SET 
    name = 'KAiOSS Demo', 
    stack = 'React / Vite / SurrealDB', 
    desc = 'AI-native project hub & Kanban board', 
    status = 'in-progress', 
    tags = ['#OSS', '#AI', '#SurrealDB'], 
    icon = '🤖', 
    cmd_start = 'make db-demo', 
    cmd_stop = 'make stop', 
    updated = time::now();

CREATE projekt:demo_cabellistpro SET 
    name = 'CabellistPro Demo', 
    stack = 'FastAPI / SvelteKit / MySQL', 
    desc = 'Fiktives B2B SaaS Kabelmanagement & HV-Prüfungen', 
    status = 'done', 
    tags = ['#Enterprise', '#Production', '#SaaS'], 
    icon = '🚀', 
    cmd_start = 'docker-compose up', 
    cmd_stop = 'docker-compose down', 
    updated = time::now();

CREATE projekt:demo_pflanternen SET 
    name = 'Pflanternen Demo', 
    stack = 'Bash / SurrealDB / NixOS', 
    desc = 'Multi-stage NixOS automation framework', 
    status = 'in-progress', 
    tags = ['#NixOS', '#Automation'], 
    icon = '🌿', 
    cmd_start = 'bash diagnose.sh', 
    cmd_stop = 'pkill diagnose.sh', 
    updated = time::now();

-- =========================================================================
-- 2. TASKS (Passend zu den Schema-Einschränkungen in init_clean.surql)
-- =========================================================================
CREATE task:demo_task1 SET
    titel = 'Architektur-Review abschließen',
    beschreibung = 'Überprüfung der globalen Singleton-Verbindung zu SurrealDB.',
    status = 'done',
    risiko = 'low',
    verifikation = 'bestanden',
    verifiziert_von = 'human',
    projekt = 'KAiOSS Demo',
    `priorität` = 1,
    tags = ['#Architecture'],
    akzeptanzkriterien = [
        { "kriterium": 'Verbindung als Singleton implementiert', "erfüllt": true },
        { "kriterium": 'Verbindungsabbrüche abgefangen', "erfüllt": true }
    ],
    erstellt = time::now() - 2d;

CREATE task:demo_task2 SET
    titel = 'Human-in-the-Loop Konzept implementieren',
    beschreibung = 'Erstellung einer Bestätigungskomponente für kritische Shell-Befehle.',
    status = 'in_arbeit',
    risiko = 'high',
    verifikation = 'ausstehend',
    projekt = 'KAiOSS Demo',
    `priorität` = 2,
    tags = ['#Security', '#UX'],
    akzeptanzkriterien = [
        { "kriterium": 'Bestätigungs-Dialog bei rm/kill-Befehlen', "erfüllt": true },
        { "kriterium": 'Timeout-Fallbacks implementieren', "erfüllt": false }
    ],
    erstellt = time::now() - 1d;

CREATE task:demo_task3 SET
    titel = 'Diagnose-Skript optimieren',
    beschreibung = 'Auslesen von Commit-Hashes und Root-Commit Fallback.',
    status = 'blockiert',
    risiko = 'medium',
    verifikation = 'ausstehend',
    projekt = 'Pflanternen Demo',
    `priorität` = 3,
    tags = ['#Bash', '#NixOS'],
    akzeptanzkriterien = [
        { "kriterium": 'Commit-Hash als ID nutzen', "erfüllt": false }
    ],
    erstellt = time::now();

-- =========================================================================
-- 3. WIKI-EINTRÄGE (Todos mit korrekten Phase-Tags für das Roadmap-HUD!)
-- =========================================================================
CREATE wiki:demo_wiki1 SET
    projekt = 'KAiOSS Demo',
    typ = 'doc',
    titel = 'Einführung & Architektur',
    inhalt = '# KAiOSS Architektur\nDieses Demo-Projekt läuft im isolierten `demo`-Namespace.',
    status = 'open',
    prioritaet = 'medium',
    erstellt = time::now() - 2d;

CREATE wiki:demo_wiki2 SET
    projekt = 'KAiOSS Demo',
    typ = 'bug',
    titel = 'Vite live query re-connect issue',
    inhalt = 'Live Queries verlieren nach Verbindungsabbruch das State-Update.',
    status = 'open',
    prioritaet = 'high',
    erstellt = time::now() - 1d;

CREATE wiki:demo_wiki3 SET
    projekt = 'KAiOSS Demo',
    typ = 'todo',
    titel = 'Human-in-the-Loop Konzept',
    inhalt = 'Bestätigungs-Dialoge für kritische Shell-Befehle einrichten.',
    status = 'open',
    prioritaet = 'high',
    tag = 'Phase 1 — Foundation & Security',
    erstellt = time::now();

CREATE wiki:demo_wiki4 SET
    projekt = 'KAiOSS Demo',
    typ = 'todo',
    titel = 'Agent-Priorisierung',
    inhalt = 'Priorisierung von KAi, LearnAgent und GitAgent.',
    status = 'open',
    prioritaet = 'medium',
    tag = 'Phase 2 — KAi Bootstrap',
    erstellt = time::now();

CREATE wiki:demo_wiki5 SET
    projekt = 'Pflanternen Demo',
    typ = 'todo',
    titel = 'NixOS VM integration',
    inhalt = 'Firecracker VM für automatisierte Integrationstests einbinden.',
    status = 'open',
    prioritaet = 'medium',
    tag = 'Phase 3 — Infrastruktur & Resilienz',
    erstellt = time::now();

-- =========================================================================
-- 4. DIAGNOSE-EINTRAG (System/Diagnostic für Pflanternen)
-- =========================================================================
CREATE wiki:demo_pflanternen_diag SET
    projekt = 'Pflanternen Demo',
    typ = 'system',
    titel = 'System-Diagnose Fehlgeschlagen (Simuliert)',
    inhalt = 'WARNING: NixOS configuration directory `/etc/nixos/` contains uncommitted changes. Build evaluation skipped.',
    status = 'open',
    prioritaet = 'high',
    erstellt = time::now();
