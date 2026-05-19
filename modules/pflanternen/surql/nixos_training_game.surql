-- Schema definition for nixos_training_game in namespace: pflanternen, database: diagnosen

DEFINE TABLE nixos_training_game SCHEMAFULL;

DEFINE FIELD task_description   ON nixos_training_game TYPE string;
DEFINE FIELD action_diff        ON nixos_training_game TYPE option<string>;
DEFINE FIELD build_success      ON nixos_training_game TYPE bool;
DEFINE FIELD error_logs         ON nixos_training_game TYPE option<string>;
DEFINE FIELD service_health     ON nixos_training_game TYPE bool;
DEFINE FIELD reward             ON nixos_training_game TYPE float;
DEFINE FIELD host               ON nixos_training_game TYPE string;
DEFINE FIELD timestamp          ON nixos_training_game TYPE datetime DEFAULT time::now();
