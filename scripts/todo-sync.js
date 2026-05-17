import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Surreal } from 'surrealdb';

// Konfiguration
const DB_ENDPOINT = 'ws://127.0.0.1:8000';
const BASE_PATHS = [
  path.join(process.env.HOME || process.env.USERPROFILE, 'Projekte/aktiv'),
  path.join(process.env.HOME || process.env.USERPROFILE, 'Projekte/archiv')
];

const db = new Surreal();

// Erweiterung 1: TODO_FILENAMES Array + Watcher Map
const TODO_FILENAMES = [
  'TODO.md', 'todo.md',
  'TODOLIST.md', 'TodoList.md', 'todolist.md',
  'ROADMAP.md', 'roadmap.md',
  'MEILENSTEINE.md', 'meilensteine.md',
  'MILESTONES.md', 'milestones.md',
  'TASKS.md', 'tasks.md'
];

// Map: projektname -> { watcher, todoPath }
const activeWatchers = new Map();

function findTodoFile(basePath, folderPath) {
    for (const filename of TODO_FILENAMES) {
        const testPath = path.join(basePath, folderPath, filename);
        if (fs.existsSync(testPath)) return testPath;
    }
    return null;
}

async function connectDB() {
    try {
        await db.connect(DB_ENDPOINT);
        await db.signin({
            username: 'root',
            password: 'root',
        });
        await db.use({ namespace: 'kaioss', database: 'kaioss' });
        console.log('✅ Verbunden mit SurrealDB');
    } catch (err) {
        console.error('❌ DB-Verbindungsfehler:', err.message);
        process.exit(1);
    }
}

function parseTodos(markdownContent, projektname, isArchiv) {
    const lines = markdownContent.split('\n');
    const todos = [];
    let currentTag = null;

    for (const line of lines) {
        const headerMatch = line.match(/^##\s+(.+)/);
        if (headerMatch) {
            currentTag = headerMatch[1].trim();
            continue;
        }

        const todoMatch = line.match(/^\s*-\s+\[( |x|X)\]\s+(.+)/);
        if (todoMatch) {
            const isDone = todoMatch[1].toLowerCase() === 'x';
            const titel = todoMatch[2].trim();
            
            // Fix 1: Archiv-Support (Immer done in archiv erzwingen)
            const status = (isArchiv || isDone) ? 'done' : 'offen';
            
            const externes_id = crypto.createHash('md5')
                .update(`${projektname}:${titel}`)
                .digest('hex')
                .slice(0, 8);

            todos.push({
                projekt: projektname,
                typ: 'todo',
                titel,
                status,
                tag: currentTag,
                externes_id
            });
        }
    }
    return todos;
}

async function syncProject(projektname, folderPath) {
    let todoPath = null;
    let isArchiv = false;
    
    // Finde TODO-Datei in aktiv oder archiv
    for (const basePath of BASE_PATHS) {
        todoPath = findTodoFile(basePath, folderPath);
        if (todoPath) {
            isArchiv = basePath.includes('archiv');
            break;
        }
    }
    
    // Fix 4: ENOENT explizit abfangen + Logging
    if (!todoPath || !fs.existsSync(todoPath)) {
        console.log(`[todo-sync] ${projektname}: keine bekannte TODO-Datei gefunden, übersprungen`);
        return { synced: 0, removed: 0 };
    }

    try {
        const content = fs.readFileSync(todoPath, 'utf8');
        const todos = parseTodos(content, projektname, isArchiv);
        const currentIds = [];

        for (const todo of todos) {
            currentIds.push(todo.externes_id);
            
            const query = `
                LET $existing = (SELECT id FROM wiki WHERE externes_id = $externes_id);
                IF array::len($existing) > 0 THEN
                    (UPDATE $existing[0].id SET 
                        status = $status, tag = $tag, geaendert = time::now())
                ELSE
                    (CREATE wiki CONTENT {
                        projekt: $projekt, typ: 'todo', titel: $titel,
                        inhalt: '',
                        status: $status, tag: $tag, externes_id: $externes_id,
                        erstellt: time::now(), geaendert: time::now()
                    })
                END;
            `;
            await db.query(query, {
                projekt: todo.projekt,
                titel: todo.titel,
                status: todo.status,
                tag: todo.tag || null,
                externes_id: todo.externes_id
            });
        }

        // Zombie-Cleanup mit Count-Rückgabe für Logging
        let removed = 0;
        if (currentIds.length > 0) {
            const cleanupRes = await db.query(`
                DELETE FROM wiki 
                WHERE typ = 'todo' AND projekt = $projekt AND externes_id NOT IN $currentIds
                RETURN BEFORE;
            `, { projekt: projektname, currentIds });
            removed = cleanupRes[0] ? cleanupRes[0].length : 0;
        } else {
            const cleanupRes = await db.query(`
                DELETE FROM wiki 
                WHERE typ = 'todo' AND projekt = $projekt
                RETURN BEFORE;
            `, { projekt: projektname });
            removed = cleanupRes[0] ? cleanupRes[0].length : 0;
        }
        
        // Fix 3: Verbessertes Logging Format
        console.log(`[todo-sync] ${projektname}: ${todos.length} TODOs synced, ${removed} removed`);
        return { synced: todos.length, removed, isArchiv, todoPath };
        
    } catch (err) {
        console.error(`❌ Fehler beim Sync von ${projektname}:`, err.message);
        return { synced: 0, removed: 0 };
    }
}

async function startWatcher(projektname, folderPath) {
    // Init-Sync ausführen
    const syncResult = await syncProject(projektname, folderPath);
    
    // Nichts zu watchen oder Projekt ist im Archiv
    if (!syncResult || !syncResult.todoPath || syncResult.isArchiv) {
        return; 
    }

    const todoPath = syncResult.todoPath;

    // Duplikat-Schutz prüfen
    if (activeWatchers.has(projektname)) {
        return; 
    }

    let fsWait = false;
    const watcher = fs.watch(todoPath, async (event, filename) => {
        if (filename) {
            if (fsWait) return;
            fsWait = setTimeout(() => { fsWait = false; }, 500); // Debounce
            await syncProject(projektname, folderPath);
        }
    });

    // Watcher in der Map speichern
    activeWatchers.set(projektname, { watcher, todoPath });
    console.log(`👀 Watcher gestartet für: ${projektname} (${path.basename(todoPath)})`);
}

async function startSync() {
    await connectDB();
    
    // 1. Initiale Abfrage: Alle bestehenden Projekte auslesen und Watcher starten
    const res = await db.query('SELECT name, todo_path FROM projekt');
    const projekte = res[0] || [];
    
    for (const p of projekte) {
        const projektname = p.name;
        const folderPath = p.todo_path || projektname;
        await startWatcher(projektname, folderPath); 
    }

    // 2. Live Query für NEUE, GEÄNDERTE oder GELÖSCHTE Projekte
    console.log('📡 Starte Live Query für Tabelle "projekt"...');
    await db.live('projekt', async (action, result) => {
        const projektname = result.name;
        const folderPath = result.todo_path || projektname;
        
        // Neues Projekt erstellt oder geupdated
        if (action === 'CREATE' || action === 'UPDATE') {
            console.log(`🔔 DB Event [${action}]: ${projektname}`);
            await startWatcher(projektname, folderPath);
        }
        
        // Projekt wurde gelöscht
        if (action === 'DELETE') {
            if (activeWatchers.has(projektname)) {
                activeWatchers.get(projektname).watcher.close();
                activeWatchers.delete(projektname);
                console.log(`🛑 Watcher beendet für gelöschtes Projekt: ${projektname}`);
            }
        }
    });
}

startSync();
