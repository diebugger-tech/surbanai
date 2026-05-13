-- ------------------------------
-- OPTION
-- ------------------------------

OPTION IMPORT;

-- ------------------------------
-- TABLE: projekt
-- ------------------------------

DEFINE TABLE projekt TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD cmd_start ON projekt TYPE string PERMISSIONS FULL;
DEFINE FIELD cmd_stop ON projekt TYPE string PERMISSIONS FULL;
DEFINE FIELD desc ON projekt TYPE string PERMISSIONS FULL;
DEFINE FIELD icon ON projekt TYPE string PERMISSIONS FULL;
DEFINE FIELD name ON projekt TYPE string PERMISSIONS FULL;
DEFINE FIELD stack ON projekt TYPE string PERMISSIONS FULL;
DEFINE FIELD status ON projekt TYPE string PERMISSIONS FULL;
DEFINE FIELD tags ON projekt TYPE array<string> PERMISSIONS FULL;
DEFINE FIELD tags[*] ON projekt TYPE string PERMISSIONS FULL;
DEFINE FIELD updated ON projekt TYPE datetime DEFAULT time::now() PERMISSIONS FULL;


DEFINE EVENT wiki_auto_create ON projekt WHEN $event = 'CREATE' THEN { INSERT INTO wiki { erstellt: time::now(), geaendert: time::now(), inhalt: 'System-generierte Uebersicht fuer ' + $after.name, prioritaet: 'medium', projekt: $after.name, status: 'open', titel: 'Uebersicht', typ: 'doc' }; };

-- ------------------------------
-- TABLE DATA: projekt
-- ------------------------------

INSERT [ { cmd_start: 'claude-code', cmd_stop: 'exit', desc: 'Multi-Agent Framework', icon: '🤖', id: projekt:agentsystem, name: 'Agenten-System', stack: 'Claude / Goose / Pi', status: 'backlog', tags: ['#AI', '#Orchestration', '#LLM'], updated: d'2026-05-13T10:03:46.927520319Z' }, { cmd_start: 'make dev', cmd_stop: 'make stop', desc: 'B2B SaaS Kabelmanagement', icon: '🚀', id: projekt:cabellistpro, name: 'CabellistPro', stack: 'FastAPI / Python / MySQL', status: 'done', tags: ['#SaaS', '#Production'], updated: d'2026-05-13T10:03:46.926455377Z' }, { cmd_start: 'composer serve', cmd_stop: 'killall php', desc: 'Community Prompt-Bewertungsmodell', icon: '📝', id: projekt:guterprompt, name: 'GuterPrompt', stack: 'PHP 8.3 / SvelteKit / FastAPI', status: 'in-progress', tags: ['#Research', '#PHP', '#AI'], updated: d'2026-05-13T10:03:46.927284912Z' }, { cmd_start: 'nix-shell', cmd_stop: 'exit', desc: 'Hardened AI Operating System environment', icon: '❄️', id: projekt:nixos_ki_os, name: 'NixOS KI-OS', stack: 'jail.nix / GitNexus / MCP', status: 'done', tags: ['#Security', '#NixOS', '#MCP'], updated: d'2026-05-13T10:03:46.927581585Z' }, { cmd_start: 'bash diagnose.sh', cmd_stop: 'pkill diagnose.sh', desc: 'Multi-stage NixOS automation framework', icon: '🌿', id: projekt:pflanternen, name: 'Pflanternen', stack: 'Bash / SurrealDB / NixOS', status: 'in-progress', tags: ['#NixOS', '#Automation', '#SurrealDB'], updated: d'2026-05-13T10:03:46.927452290Z' }, { cmd_start: 'cargo run', cmd_stop: 'killall 3dnterminal', desc: '3D-Flip Terminal for Cosmic Desktop', icon: '🖥️', id: projekt:terminal, name: '3DNTerminal', stack: 'Rust / Bevy / Wayland', status: 'in-progress', tags: ['#Rust', '#Wayland', '#Graphics'], updated: d'2026-05-13T10:03:46.927377207Z' } ];

-- ------------------------------
-- TABLE: wiki
-- ------------------------------

DEFINE TABLE wiki TYPE NORMAL SCHEMAFULL PERMISSIONS NONE;

DEFINE FIELD erstellt ON wiki TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD geaendert ON wiki TYPE datetime DEFAULT time::now() PERMISSIONS FULL;
DEFINE FIELD inhalt ON wiki TYPE string PERMISSIONS FULL;
DEFINE FIELD prioritaet ON wiki TYPE string DEFAULT 'medium' PERMISSIONS FULL;
DEFINE FIELD projekt ON wiki TYPE string PERMISSIONS FULL;
DEFINE FIELD status ON wiki TYPE string DEFAULT 'open' PERMISSIONS FULL;
DEFINE FIELD titel ON wiki TYPE string PERMISSIONS FULL;
DEFINE FIELD typ ON wiki TYPE string PERMISSIONS FULL;



-- ------------------------------
-- TABLE DATA: wiki
-- ------------------------------

INSERT [ { erstellt: d'2026-05-13T10:03:46.927021081Z', geaendert: d'2026-05-13T10:03:46.927022043Z', id: wiki:8psxu2smcoc8h9pg6ush, inhalt: 'System-generierte Uebersicht fuer CabellistPro', prioritaet: 'medium', projekt: 'CabellistPro', status: 'open', titel: 'Uebersicht', typ: 'doc' }, { erstellt: d'2026-05-13T10:03:46.927535798Z', geaendert: d'2026-05-13T10:03:46.927536129Z', id: wiki:aocmfe5xoq1hbrmni7uv, inhalt: 'System-generierte Uebersicht fuer Agenten-System', prioritaet: 'medium', projekt: 'Agenten-System', status: 'open', titel: 'Uebersicht', typ: 'doc' }, { erstellt: d'2026-05-13T10:03:46.927310931Z', geaendert: d'2026-05-13T10:03:46.927311402Z', id: wiki:atjlspnkwglfrrjenrh7, inhalt: 'System-generierte Uebersicht fuer GuterPrompt', prioritaet: 'medium', projekt: 'GuterPrompt', status: 'open', titel: 'Uebersicht', typ: 'doc' }, { erstellt: d'2026-05-13T10:03:46.927468440Z', geaendert: d'2026-05-13T10:03:46.927468801Z', id: wiki:ifhcihz5tr83hhb250u0, inhalt: 'System-generierte Uebersicht fuer Pflanternen', prioritaet: 'medium', projekt: 'Pflanternen', status: 'open', titel: 'Uebersicht', typ: 'doc' }, { erstellt: d'2026-05-13T10:03:46.927598908Z', geaendert: d'2026-05-13T10:03:46.927599269Z', id: wiki:r1snm2eri1h5bgui4kd1, inhalt: 'System-generierte Uebersicht fuer NixOS KI-OS', prioritaet: 'medium', projekt: 'NixOS KI-OS', status: 'open', titel: 'Uebersicht', typ: 'doc' }, { erstellt: d'2026-05-13T10:03:46.927398307Z', geaendert: d'2026-05-13T10:03:46.927398648Z', id: wiki:w2grvtwtuh4psjsf62e2, inhalt: 'System-generierte Uebersicht fuer 3DNTerminal', prioritaet: 'medium', projekt: '3DNTerminal', status: 'open', titel: 'Uebersicht', typ: 'doc' } ];

