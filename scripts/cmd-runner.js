/**
 * KAiOSS Command Runner — Background Executor
 *
 * Verbindet zu SurrealDB via Live Query auf task_queue.
 * Pro Task:
 *   1. security.validateAlias(task.alias)
 *   2. security.requestApproval(taskId, alias, entry, db)  [HITL Gate]
 *   3. Bei Approval: spawn nixos/bwrap.sh <cmd> <alias>  [sandbox: true]
 *                 oder: spawn direkt                      [sandbox: false]
 *   4. Stdout/Stderr buffern → kai_command_log (einmalig nach Prozessende)
 *   5. Exit code → task_queue.status = 'done'|'failed'
 *
 * Fehlerbehandlung:
 *   - SurrealDB down        → exponential backoff (max 5 Versuche)
 *   - bwrap nicht gefunden  → klarer Fehler, kein Absturz
 *   - Race Conditions       → atomares UPDATE WHERE status = 'pending'
 *   - high/critical Timeout → status = 'timeout', kein Auto-Execute
 */

import { readFileSync, existsSync } from 'fs';
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Surreal } from 'surrealdb';
import {
    validateAlias,
    evaluateRisk,
    requestApproval,
    logDecision,
} from './security.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Lade .env und .env.local in process.env
const loadEnv = () => {
    const envPaths = [
        join(__dirname, '../.env'),
        join(__dirname, '../.env.local')
    ];
    for (const p of envPaths) {
        if (existsSync(p)) {
            try {
                const content = readFileSync(p, 'utf8');
                for (const line of content.split('\n')) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed.startsWith('#')) continue;
                    const idx = trimmed.indexOf('=');
                    if (idx === -1) continue;
                    const key = trimmed.slice(0, idx).trim();
                    const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
                    process.env[key] = val;
                }
            } catch (err) {
                console.error(`[cmd-runner] Fehler beim Laden von ${p}:`, err.message);
            }
        }
    }
};

loadEnv();

const BWRAP_SH   = join(__dirname, '../nixos/bwrap.sh');

const DB_ENDPOINT = process.env.VITE_SURREAL_URL
    ? process.env.VITE_SURREAL_URL.replace('/rpc', '')
    : 'ws://127.0.0.1:8000';
const DB_NS   = process.env.VITE_SURREAL_NS   || 'kaioss';
const DB_DB   = process.env.VITE_SURREAL_DB   || 'kaioss';
const DB_USER = process.env.VITE_SURREAL_USER || 'root';
const DB_PASS = process.env.VITE_SURREAL_PASS || 'root';

const MAX_RETRIES    = 5;
const MAX_LOG_BYTES  = 10_000;  // stdout-Truncierung in kai_command_log

const db = new Surreal();

// ---------------------------------------------------------------------------
// DB-Verbindung mit exponential backoff
// ---------------------------------------------------------------------------
async function connectWithRetry(attempt = 1) {
    try {
        await db.connect(DB_ENDPOINT);
        await db.signin({ username: DB_USER, password: DB_PASS });
        await db.use({ namespace: DB_NS, database: DB_DB });
        console.log(`[cmd-runner] ✅ SurrealDB verbunden (${DB_ENDPOINT})`);
    } catch (err) {
        if (attempt >= MAX_RETRIES) {
            console.error(`[cmd-runner] ❌ SurrealDB nicht erreichbar nach ${MAX_RETRIES} Versuchen. Abbruch.`);
            process.exit(1);
        }
        const delay = Math.min(1000 * Math.pow(2, attempt), 30_000);
        console.warn(`[cmd-runner] ⚠️  Verbindungsfehler (Versuch ${attempt}/${MAX_RETRIES}), retry in ${delay}ms…`);
        await new Promise(r => setTimeout(r, delay));
        return connectWithRetry(attempt + 1);
    }
}

// ---------------------------------------------------------------------------
// bwrap-Verfügbarkeit prüfen (einmalig beim Start)
// ---------------------------------------------------------------------------
async function checkBwrapAvailable() {
    return new Promise((resolve) => {
        const which = spawn('which', ['bwrap'], { stdio: 'ignore' });
        which.on('close', (code) => {
            if (code === 0) return resolve(true);
            // Fallback: Nix-Store durchsuchen
            const find = spawn(
                'find',
                ['/nix/store', '-maxdepth', '5', '-name', 'bwrap', '-type', 'f', '-perm', '/111'],
                { stdio: ['ignore', 'pipe', 'ignore'] }
            );
            let found = false;
            find.stdout.on('data', () => { found = true; find.kill(); });
            find.on('close', () => resolve(found));
        });
    });
}

// ---------------------------------------------------------------------------
// Befehl ausführen: Sandbox (bwrap.sh) oder direkt
// ---------------------------------------------------------------------------
async function executeCommand(alias, cmd, useSandbox, bwrapAvailable) {
    if (useSandbox && !bwrapAvailable) {
        throw new Error('bwrap nicht verfügbar — Sandbox-Ausführung nicht möglich. Installiere bubblewrap.');
    }

    return new Promise((resolve, reject) => {
        let proc;
        if (useSandbox) {
            // bwrap.sh bekommt: <cmd> <alias>
            proc = spawn('bash', [BWRAP_SH, cmd, alias], {
                stdio: ['ignore', 'pipe', 'pipe'],
            });
        } else {
            // Nicht-Sandbox-Befehle (sandbox: false): direkt ausführen
            proc = spawn('bash', ['-c', cmd], {
                stdio: ['ignore', 'pipe', 'pipe'],
            });
        }

        const stdoutChunks = [];
        const stderrChunks = [];

        proc.stdout.on('data', (chunk) => stdoutChunks.push(chunk));
        proc.stderr.on('data', (chunk) => stderrChunks.push(chunk));
        proc.on('error', reject);

        proc.on('close', (exitCode) => {
            // Stdout/Stderr werden ERST NACH Prozessende gebündelt geschrieben
            const stdout = Buffer.concat(stdoutChunks).toString('utf8').slice(0, MAX_LOG_BYTES);
            const stderr = Buffer.concat(stderrChunks).toString('utf8').slice(0, MAX_LOG_BYTES / 2);
            resolve({ exitCode: exitCode ?? 1, stdout, stderr });
        });
    });
}

// ---------------------------------------------------------------------------
// Einzelnen Task verarbeiten
// ---------------------------------------------------------------------------
async function processTask(task, bwrapAvailable) {
    const { id, alias } = task;

    // --- Atomares Claim: status → 'running' nur wenn noch 'pending' ---
    const claimed = await db.query(
        `UPDATE task_queue
         SET status = 'running', started_at = time::now()
         WHERE id = $id AND status = 'pending'
         RETURN AFTER`,
        { id }
    );

    // Leeres Ergebnis = anderer Runner hat den Task bereits übernommen
    if (!claimed?.[0]?.length) {
        console.log(`[cmd-runner] ⏭  Task ${id} (${alias}) bereits von anderer Instanz übernommen.`);
        return;
    }

    // --- Alias validieren ---
    let entry;
    try {
        entry = validateAlias(alias);
    } catch (err) {
        console.error(`[cmd-runner] ❌ Unbekannter Alias '${alias}':`, err.message);
        await db.query(
            `UPDATE task_queue SET status = 'failed', error = $e, finished_at = time::now() WHERE id = $id`,
            { e: `Unbekannter Alias: ${alias}`, id }
        );
        await logDecision(db, alias, 'rejected', null);
        return;
    }

    // --- HITL Gate ---
    let approved = false;
    try {
        approved = await requestApproval(id, alias, entry, db);
    } catch (err) {
        console.error(`[cmd-runner] ❌ requestApproval-Fehler für '${alias}':`, err.message);
        await db.query(
            `UPDATE task_queue SET status = 'error', error = $e, finished_at = time::now() WHERE id = $id`,
            { e: err.message, id }
        );
        return;
    }

    if (!approved) {
        console.log(`[cmd-runner] 🚫 Task '${alias}' abgelehnt oder Timeout.`);
        await logDecision(db, alias, 'rejected', 'human');
        return;
    }

    // --- Ausführen ---
    const useSandbox = entry.sandbox ?? true;
    let result;
    try {
        result = await executeCommand(alias, entry.cmd, useSandbox, bwrapAvailable);
    } catch (err) {
        console.error(`[cmd-runner] ❌ Ausführungsfehler '${alias}':`, err.message);
        await db.query(
            `UPDATE task_queue SET status = 'error', error = $e, finished_at = time::now() WHERE id = $id`,
            { e: err.message, id }
        );
        await logDecision(db, alias, 'error', null);
        return;
    }

    const finalStatus = result.exitCode === 0 ? 'done' : 'failed';

    // --- task_queue abschließen (Status + Exit-Code) ---
    await db.query(
        `UPDATE task_queue
         SET status = $status, exit_code = $exitCode, finished_at = time::now()
         WHERE id = $id`,
        { status: finalStatus, exitCode: result.exitCode, id }
    );

    // --- Audit-Log (stdout/stderr einmalig, gebündelt) ---
    await db.query(
        `CREATE kai_command_log CONTENT {
            command:       $alias,
            risiko:        $risiko,
            status:        $status,
            user_approved: true,
            stdout:        $stdout,
            stderr:        $stderr,
            exit_code:     $exitCode,
            timestamp:     time::now()
        }`,
        {
            alias,
            risiko:   entry.risiko,
            status:   finalStatus,
            stdout:   result.stdout,
            stderr:   result.stderr,
            exitCode: result.exitCode,
        }
    );

    console.log(`[cmd-runner] ${finalStatus === 'done' ? '✅' : '❌'} '${alias}' → ${finalStatus} (exit ${result.exitCode})`);
    await logDecision(db, alias, finalStatus, 'approved');
}

// ---------------------------------------------------------------------------
// Hauptloop
// ---------------------------------------------------------------------------
async function startRunner() {
    await connectWithRetry();

    const bwrapAvailable = await checkBwrapAvailable();
    if (!bwrapAvailable) {
        console.warn('[cmd-runner] ⚠️  bwrap nicht gefunden — Befehle mit sandbox:true werden fehlschlagen.');
    } else {
        console.log('[cmd-runner] 🔒 bwrap verfügbar — Sandbox aktiv.');
    }

    // Initiale Abfrage: bereits offene Tasks bearbeiten
    const pending = await db.query("SELECT * FROM task_queue WHERE status = 'pending'");
    const initialTasks = pending?.[0] ?? [];
    console.log(`[cmd-runner] 📋 ${initialTasks.length} offene Tasks beim Start.`);

    for (const task of initialTasks) {
        processTask(task, bwrapAvailable).catch(err =>
            console.error('[cmd-runner] processTask Fehler:', err)
        );
    }

    // Live Query für neue Tasks
    console.log('[cmd-runner] 📡 Live Query aktiv auf task_queue…');
    await db.live('task_queue', ({ action, result }) => {
        // Nur neue Tasks und Tasks die zurück auf pending gesetzt werden
        if (
            (action === 'CREATE' && result.status === 'pending') ||
            (action === 'UPDATE' && result.status === 'pending')
        ) {
            processTask(result, bwrapAvailable).catch(err =>
                console.error('[cmd-runner] processTask Fehler:', err)
            );
        }
    });
}

startRunner();
