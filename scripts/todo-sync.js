import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Surreal } from 'surrealdb';

// Konfiguration
const DB_ENDPOINT = 'ws://127.0.0.1:8000';
const PROJEKTE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, 'Projekte/aktiv');

const db = new Surreal();

async function connectDB() {
    try {
        await db.connect(DB_ENDPOINT);
        await db.signin({
            user: 'root',
            pass: 'root',
        });
        await db.use({ ns: 'kaioss', db: 'kaioss' });
        console.log('✅ Verbunden mit SurrealDB');
    } catch (err) {
        console.error('❌ DB-Verbindungsfehler:', err.message);
        process.exit(1);
    }
}

function parseTodos(markdownContent, projektname) {
    const lines = markdownContent.split('\n');
    const todos = [];
    let currentTag = null;

    for (const line of lines) {
        // Parse Header (e.g. ## KAiOSS)
        const headerMatch = line.match(/^##\s+(.+)/);
        if (headerMatch) {
            currentTag = headerMatch[1].trim();
            continue;
        }

        // Parse Checkboxen
        const todoMatch = line.match(/^\s*-\s+\[( |x|X)\]\s+(.+)/);
        if (todoMatch) {
            const isDone = todoMatch[1].toLowerCase() === 'x';
            const titel = todoMatch[2].trim();
            const status = isDone ? 'done' : 'offen';
            
            // Generiere stabilen Hash ID
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

async function syncProject(projektname) {
    const todoPath = path.join(PROJEKTE_DIR, projektname, 'TODO.md');
    
    if (!fs.existsSync(todoPath)) {
        return;
    }

    try {
        const content = fs.readFileSync(todoPath, 'utf8');
        const todos = parseTodos(content, projektname);
        
        console.log(`🔄 Syncing ${todos.length} TODOs für Projekt [${projektname}]`);
        
        const currentIds = [];

        // UPSERT
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

        // Zombie-Cleanup
        if (currentIds.length > 0) {
            await db.query(`
                DELETE FROM wiki 
                WHERE typ = 'todo' AND projekt = $projekt AND externes_id NOT IN $currentIds
            `, { projekt: projektname, currentIds });
        } else {
             await db.query(`
                DELETE FROM wiki 
                WHERE typ = 'todo' AND projekt = $projekt
            `, { projekt: projektname });
        }
        
    } catch (err) {
        console.error(`❌ Fehler beim Sync von ${projektname}:`, err.message);
    }
}

async function startSync() {
    await connectDB();
    
    // 1. Hole alle Projekte
    const res = await db.query('SELECT name FROM projekt');
    const projekte = res[0]; 

    if (!projekte || projekte.length === 0) {
        console.log('Keine Projekte gefunden.');
        return;
    }

    // 2. Initial Full-Sync & Setup Watchers
    for (const p of projekte) {
        const projektname = p.name;
        await syncProject(projektname);

        const todoPath = path.join(PROJEKTE_DIR, projektname, 'TODO.md');
        if (fs.existsSync(todoPath)) {
            // Watcher initialisieren
            console.log(`👀 Watching ${todoPath}`);
            
            // Debounce für fs.watch
            let fsWait = false;
            fs.watch(todoPath, async (event, filename) => {
                if (filename) {
                    if (fsWait) return;
                    fsWait = setTimeout(() => {
                        fsWait = false;
                    }, 500);
                    console.log(`📝 File geändert: ${todoPath} -> Sync...`);
                    await syncProject(projektname);
                }
            });
        }
    }
}

startSync();
