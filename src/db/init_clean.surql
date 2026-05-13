-- KAiOSS v1.4 Database Initialization
-- Namespace: kaioss | Database: kaioss

REMOVE TABLE IF EXISTS projekt;
REMOVE TABLE IF EXISTS wiki;

DEFINE TABLE projekt SCHEMAFULL;
DEFINE FIELD name ON TABLE projekt TYPE string;
DEFINE FIELD stack ON TABLE projekt TYPE string;
DEFINE FIELD desc ON TABLE projekt TYPE string;
DEFINE FIELD icon ON TABLE projekt TYPE string;
DEFINE FIELD status ON TABLE projekt TYPE string;
DEFINE FIELD tags ON TABLE projekt TYPE array<string>;
DEFINE FIELD cmd_start ON TABLE projekt TYPE string;
DEFINE FIELD cmd_stop ON TABLE projekt TYPE string;
DEFINE FIELD updated ON TABLE projekt TYPE datetime DEFAULT time::now();

DEFINE TABLE wiki SCHEMAFULL;
DEFINE FIELD projekt ON TABLE wiki TYPE string;
DEFINE FIELD typ ON TABLE wiki TYPE string; -- 'doc', 'bug', 'todo', 'system'
DEFINE FIELD titel ON TABLE wiki TYPE string;
DEFINE FIELD inhalt ON TABLE wiki TYPE string;
DEFINE FIELD status ON TABLE wiki TYPE string DEFAULT 'open';
DEFINE FIELD prioritaet ON TABLE wiki TYPE string DEFAULT 'medium';
DEFINE FIELD erstellt ON TABLE wiki TYPE datetime DEFAULT time::now();
DEFINE FIELD geaendert ON TABLE wiki TYPE datetime DEFAULT time::now();

DEFINE EVENT wiki_auto_create ON TABLE projekt WHEN $event = "CREATE" THEN {
  INSERT INTO wiki {
    projekt: $after.name,
    typ: 'doc',
    titel: 'Uebersicht',
    inhalt: 'System-generierte Uebersicht fuer ' + $after.name,
    erstellt: time::now(),
    geaendert: time::now(),
    status: 'open',
    prioritaet: 'medium'
  };
};
