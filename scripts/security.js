/**
 * KAiOSS Security Module — HITL Gate Controller
 *
 * Schicht 2 des Sicherheitssubsystems: Alias-Validierung, Risikobewertung
 * und Human-in-the-Loop Freigabelogik.
 *
 * SurrealDB Schema (siehe scripts/setup-security.surql):
 *
 * DEFINE TABLE kai_command_log SCHEMAFULL;
 * DEFINE FIELD command        ON kai_command_log TYPE string;
 * DEFINE FIELD risiko         ON kai_command_log TYPE string;
 * DEFINE FIELD status         ON kai_command_log TYPE string;
 * DEFINE FIELD user_approved  ON kai_command_log TYPE bool DEFAULT false;
 * DEFINE FIELD approved_by    ON kai_command_log TYPE option<string>;
 * DEFINE FIELD stdout         ON kai_command_log TYPE option<string>;
 * DEFINE FIELD stderr         ON kai_command_log TYPE option<string>;
 * DEFINE FIELD exit_code      ON kai_command_log TYPE option<int>;
 * DEFINE FIELD timestamp      ON kai_command_log TYPE datetime DEFAULT time::now();
 *
 * DEFINE TABLE task_queue SCHEMAFULL;
 * DEFINE FIELD alias                 ON task_queue TYPE string;
 * DEFINE FIELD status                ON task_queue TYPE string DEFAULT 'pending'
 *     ASSERT $value IN ['pending','awaiting_approval','approved','running',
 *                       'done','failed','error','timeout','cancelled'];
 * DEFINE FIELD approved_by           ON task_queue TYPE option<string>;
 * DEFINE FIELD approval_requested_at ON task_queue TYPE option<datetime>;
 * DEFINE FIELD started_at            ON task_queue TYPE option<datetime>;
 * DEFINE FIELD finished_at           ON task_queue TYPE option<datetime>;
 * DEFINE FIELD exit_code             ON task_queue TYPE option<int>;
 * DEFINE FIELD error                 ON task_queue TYPE option<string>;
 * DEFINE FIELD created_at            ON task_queue TYPE datetime DEFAULT time::now();
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMMANDS_JSON = join(__dirname, '../.kai/commands.json');

// TTL-Cache für Policy-Dateien
let policyCache = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 5000;

// Polling-Intervall in ms für awaiting_approval-Status
const POLL_INTERVAL_MS = 2000;

/**
 * loadPolicy() — Liest .kai/commands.json und gibt das Policy-Objekt zurück.
 * Lädt bei PFLANTERNEN_ENABLED=true zusätzlich die Modul-Policy.
 *
 * @returns {Object} Policy-Mapping: alias → { cmd, risiko, beschreibung, sandbox }
 */
export function loadPolicy() {
    const now = Date.now();
    if (policyCache && (now - lastCacheTime < CACHE_TTL_MS)) {
        return policyCache;
    }

    try {
        const raw = readFileSync(COMMANDS_JSON, 'utf8');
        let policy = JSON.parse(raw);

        // Modul: Pflanternen (NixOS-spezifisch)
        const pflanternenEnabled = process.env.PFLANTERNEN_ENABLED === 'true';
        const pflanternenCommandsPath = join(__dirname, '../modules/pflanternen/.kai/commands.json');

        if (pflanternenEnabled && existsSync(pflanternenCommandsPath)) {
            try {
                const pflanternenRaw = readFileSync(pflanternenCommandsPath, 'utf8');
                const pflanternenPolicy = JSON.parse(pflanternenRaw);
                policy = { ...policy, ...pflanternenPolicy };
            } catch (moduleErr) {
                console.error(`[security] Fehler beim Laden des Pflanternen-Moduls:`, moduleErr.message);
            }
        }

        policyCache = policy;
        lastCacheTime = now;
        return policy;
    } catch (err) {
        throw new Error(`security: Konnte .kai/commands.json nicht laden: ${err.message}`);
    }
}

/**
 * validateAlias(alias) — Prüft ob der Alias in der Whitelist existiert.
 *
 * @param {string} alias  Alias-Schlüssel aus commands.json
 * @returns {Object}      PolicyEntry { cmd, risiko, beschreibung, sandbox }
 * @throws {Error}        Wenn Alias unbekannt
 */
export function validateAlias(alias) {
    const policy = loadPolicy();
    const entry = policy[alias];
    if (!entry) {
        throw new Error(`security: Unbekannter Alias '${alias}' — nicht in commands.json`);
    }
    return entry;
}

/**
 * evaluateRisk(entry) — Ordnet Risikolevel einer Aktions-Klasse zu.
 *
 * low      → auto      (sofort ausführen)
 * medium   → notify    (Toast + 60s Auto-Approve)
 * high     → confirm   (warten auf human approved)
 * critical → blocked   (kein Timeout, manuelle Freigabe zwingend)
 *
 * @param {Object} entry  PolicyEntry
 * @returns {'auto'|'notify'|'confirm'|'blocked'}
 */
export function evaluateRisk(entry) {
    switch (entry.risiko) {
        case 'low':      return 'auto';
        case 'medium':   return 'notify';
        case 'high':     return 'confirm';
        case 'critical': return 'blocked';
        default:         return 'blocked';
    }
}

/**
 * requestApproval(taskQueueId, alias, entry, db)
 * HITL-Gate: Setzt task_queue.status und wartet ggf. auf menschliche Freigabe.
 *
 * low      → resolve(true) sofort
 * medium   → UPDATE awaiting_approval, 60s Timeout → auto-approve
 * high     → UPDATE awaiting_approval, wartet unbegrenzt
 * critical → UPDATE awaiting_approval, wartet unbegrenzt, kein Auto-Approve
 *
 * @param {string} taskQueueId  SurrealDB-ID des task_queue-Eintrags
 * @param {string} alias        Alias-Key (für Logging)
 * @param {Object} entry        PolicyEntry
 * @param {Surreal} db          SurrealDB-Instanz
 * @returns {Promise<boolean>}  true = approved, false = abgelehnt/timeout
 */
export async function requestApproval(taskQueueId, alias, entry, db) {
    const risikoLevel = entry.risiko;

    if (risikoLevel === 'low') {
        return true;
    }

    // Medium/High/Critical: Status setzen und auf Freigabe warten
    await db.query(
        'UPDATE task_queue SET status = $status, approval_requested_at = time::now() WHERE id = $id',
        { status: 'awaiting_approval', id: taskQueueId }
    );

    const timeoutMs   = risikoLevel === 'medium' ? 60_000 : null;
    const autoApprove = risikoLevel === 'medium';

    return waitForApproval(taskQueueId, db, timeoutMs, autoApprove);
}

/**
 * waitForApproval(taskQueueId, db, timeoutMs, autoApproveOnTimeout)
 * Polling-Loop: Prüft alle POLL_INTERVAL_MS ob status 'approved' oder 'cancelled'.
 *
 * @param {string}  taskQueueId
 * @param {Surreal} db
 * @param {number|null} timeoutMs           null = unbegrenzt
 * @param {boolean}     autoApproveOnTimeout true = auto-approve nach Timeout
 * @returns {Promise<boolean>}
 */
async function waitForApproval(taskQueueId, db, timeoutMs, autoApproveOnTimeout) {
    return new Promise((resolve) => {
        const startTime = Date.now();

        const poll = setInterval(async () => {
            try {
                const result = await db.query(
                    'SELECT status FROM task_queue WHERE id = $id',
                    { id: taskQueueId }
                );

                const row = result?.[0]?.[0];

                if (!row) {
                    clearInterval(poll);
                    resolve(false);
                    return;
                }

                if (row.status === 'approved') {
                    clearInterval(poll);
                    resolve(true);
                    return;
                }

                if (row.status === 'cancelled' || row.status === 'failed') {
                    clearInterval(poll);
                    resolve(false);
                    return;
                }

                // Timeout prüfen
                if (timeoutMs !== null && (Date.now() - startTime) >= timeoutMs) {
                    clearInterval(poll);
                    if (autoApproveOnTimeout) {
                        await db.query(
                            'UPDATE task_queue SET status = $status, approved_by = $by WHERE id = $id',
                            { status: 'approved', by: 'auto-timeout', id: taskQueueId }
                        );
                        resolve(true);
                    } else {
                        await db.query(
                            'UPDATE task_queue SET status = $status WHERE id = $id',
                            { status: 'timeout', id: taskQueueId }
                        );
                        resolve(false);
                    }
                }
            } catch (err) {
                // DB-Fehler beim Polling: Weiter versuchen (kein Abbruch)
                console.error(`[security] Polling-Fehler für ${taskQueueId}:`, err.message);
            }
        }, POLL_INTERVAL_MS);
    });
}

/**
 * logDecision(db, alias, decision, approvedBy)
 * Schreibt Entscheidung in kai_command_log (Audit-Trail).
 *
 * @param {Surreal} db
 * @param {string} alias
 * @param {string} decision     z.B. 'approved', 'rejected', 'timeout', 'error'
 * @param {string|null} approvedBy
 */
export async function logDecision(db, alias, decision, approvedBy = null) {
    try {
        const policy = loadPolicy();
        const risiko = policy[alias]?.risiko ?? 'unknown';
        const userApproved = approvedBy !== null && approvedBy !== 'auto-timeout';

        await db.query(
            `CREATE kai_command_log CONTENT {
                command:       $alias,
                risiko:        $risiko,
                status:        $decision,
                user_approved: $userApproved,
                approved_by:   $approvedBy,
                timestamp:     time::now()
            }`,
            { alias, risiko, decision, userApproved, approvedBy: approvedBy || undefined }
        );
    } catch (err) {
        // Logging-Fehler darf den Hauptfluss nicht unterbrechen
        console.error(`[security] logDecision-Fehler für '${alias}':`, err.message);
    }
}
