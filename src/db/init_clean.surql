-- KAiOSS v1.4 Database Initialization
-- Namespace: kaioss | Database: kaioss

REMOVE TABLE IF EXISTS projekt;
REMOVE TABLE IF EXISTS wiki;
REMOVE TABLE IF EXISTS task;
REMOVE TABLE IF EXISTS kai_log;

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
DEFINE FIELD tag ON TABLE wiki TYPE option<string>;
DEFINE FIELD externes_id ON TABLE wiki TYPE option<string>;

DEFINE INDEX idx_wiki_externes_id ON TABLE wiki COLUMNS externes_id UNIQUE;

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

-- === task table ===
DEFINE TABLE task SCHEMAFULL;
DEFINE FIELD titel               ON task TYPE string;
DEFINE FIELD beschreibung        ON task TYPE option<string>;
DEFINE FIELD status              ON task TYPE string DEFAULT 'offen'
    ASSERT $value IN ['offen','in_arbeit','blockiert','done'];
DEFINE FIELD risiko              ON task TYPE string DEFAULT 'medium'
    ASSERT $value IN ['low','medium','high','critical'];
DEFINE FIELD verifikation        ON task TYPE string DEFAULT 'ausstehend'
    ASSERT $value IN ['ausstehend','bestanden','abgelehnt'];
DEFINE FIELD verifiziert_von     ON task TYPE option<string>
    ASSERT $value = NONE OR $value IN ['kai','validationagent','human'];
DEFINE FIELD zugewiesen_an       ON task TYPE option<string>;
DEFINE FIELD akzeptanzkriterien  ON task TYPE array<object> DEFAULT [];
DEFINE FIELD akzeptanzkriterien.*.kriterium ON task TYPE string;
DEFINE FIELD akzeptanzkriterien.*.erfüllt ON task TYPE bool DEFAULT false;
DEFINE FIELD depends_on          ON task TYPE array<record<task>> DEFAULT [];
DEFINE FIELD projekt             ON task TYPE string;
DEFINE FIELD priorität           ON task TYPE option<int>;
DEFINE FIELD tags                ON task TYPE option<array<string>>;
DEFINE FIELD erstellt            ON task TYPE datetime DEFAULT time::now();
DEFINE FIELD geändert            ON task TYPE datetime DEFAULT time::now() VALUE time::now();

DEFINE INDEX idx_task_status   ON task FIELDS status;
DEFINE INDEX idx_task_projekt  ON task FIELDS projekt;
DEFINE INDEX idx_task_prio     ON task FIELDS priorität;

-- Guards handled app-seitig to avoid async event issues in SurrealDB

-- === kai_log table ===
DEFINE TABLE kai_log SCHEMAFULL;
DEFINE FIELD task      ON kai_log TYPE record<task>;
DEFINE FIELD agent     ON kai_log TYPE string;
DEFINE FIELD modell    ON kai_log TYPE string;
DEFINE FIELD aktion    ON kai_log TYPE string
    ASSERT $value IN ['prompt','response','update','verify','error'];
DEFINE FIELD prompt    ON kai_log TYPE option<string>;
DEFINE FIELD response  ON kai_log TYPE option<string>;
DEFINE FIELD ergebnis  ON kai_log TYPE option<string>;
DEFINE FIELD bewertung ON kai_log TYPE option<int>;
DEFINE FIELD timestamp ON kai_log TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_kai_log_task  ON kai_log FIELDS task;
