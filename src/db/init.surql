-- KAiOSS v1.4 Database Initialization
-- Namespace: kaioss | Database: kaioss

-- 1. Tables & Indices (Implicitly created on first insert, but good to define)
DEFINE TABLE projekt SCHEMAFULL;
DEFINE FIELD name ON TABLE projekt TYPE string;
DEFINE FIELD stack ON TABLE projekt TYPE string;
DEFINE FIELD desc ON TABLE projekt TYPE string;
DEFINE FIELD icon ON TABLE projekt TYPE string;
DEFINE FIELD spalte ON TABLE projekt TYPE string;
DEFINE FIELD tags ON TABLE projekt TYPE array<string>;
DEFINE FIELD manifest ON TABLE projekt TYPE object;

DEFINE TABLE wiki SCHEMAFULL;
DEFINE FIELD projekt ON TABLE wiki TYPE string; -- Matches projekt.name
DEFINE FIELD typ ON TABLE wiki TYPE string; -- 'doc', 'bug', 'todo', 'system'
DEFINE FIELD titel ON TABLE wiki TYPE string;
DEFINE FIELD inhalt ON TABLE wiki TYPE string;
DEFINE FIELD status ON TABLE wiki TYPE string DEFAULT 'open';
DEFINE FIELD prioritaet ON TABLE wiki TYPE string DEFAULT 'medium';
DEFINE FIELD erstellt ON TABLE wiki TYPE datetime DEFAULT time::now();
DEFINE FIELD geaendert ON TABLE wiki TYPE datetime DEFAULT time::now();

-- 2. Events: Auto-create Wiki entry for new projects
REMOVE EVENT IF EXISTS wiki_auto_create ON TABLE projekt;
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

-- 3. Migration: Populate Wiki for existing projects (Run manually)
/*
FOR $p IN (SELECT name FROM projekt) {
  IF (SELECT count() FROM wiki WHERE projekt = $p.name AND titel = 'Uebersicht') = 0 {
    INSERT INTO wiki {
      projekt: $p.name,
      typ: 'doc',
      titel: 'Uebersicht',
      inhalt: 'System-generierte Uebersicht fuer ' + $p.name,
      erstellt: time::now(),
      geaendert: time::now(),
      status: 'open',
      prioritaet: 'medium'
    };
  };
};
*/

-- 4. Agent Memory / Conversation History Schema
DEFINE TABLE conversation SCHEMAFULL;
DEFINE FIELD agent_name ON conversation TYPE string;
DEFINE FIELD topic      ON conversation TYPE option<string>;
DEFINE FIELD summary    ON conversation TYPE option<string>;
DEFINE FIELD created_at ON conversation TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON conversation TYPE datetime DEFAULT time::now();

DEFINE TABLE conversation_message SCHEMAFULL;
DEFINE FIELD conversation ON conversation_message TYPE record<conversation>;
DEFINE FIELD role         ON conversation_message TYPE string; -- 'user' | 'agent' | 'system'
DEFINE FIELD content      ON conversation_message TYPE string;
DEFINE FIELD timestamp    ON conversation_message TYPE datetime DEFAULT time::now();

