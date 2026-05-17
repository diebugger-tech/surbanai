import db from '../lib/db';

const normalizeId = (id) => String(id?.id || id).replace(/^task:/, '');

export function hasCycle(taskId, dependsOn, allTasks) {
  if (!dependsOn || !dependsOn.length) return false;
  
  const startId = normalizeId(taskId);
  const visited = new Set();
  const queue = [...dependsOn.map(normalizeId)];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (currentId === startId) return true;
    
    if (!visited.has(currentId)) {
      visited.add(currentId);
      // Finde den Task im Array (ID kann String oder Objekt sein)
      const taskObj = allTasks.find(t => normalizeId(t.id) === currentId);
      if (taskObj && taskObj.depends_on && taskObj.depends_on.length > 0) {
        queue.push(...taskObj.depends_on.map(normalizeId));
      }
    }
  }
  return false;
}

export function validateBeforeUpdate(taskUpdate, allTasks) {
  // Guard 1: status=done → alle akzeptanzkriterien.erfüllt = true
  if (taskUpdate.status === 'done' && taskUpdate.akzeptanzkriterien && taskUpdate.akzeptanzkriterien.length > 0) {
    const allMet = taskUpdate.akzeptanzkriterien.every(k => k.erfüllt === true);
    if (!allMet) {
      return { valid: false, error: 'Nicht alle Akzeptanzkriterien sind erfüllt.' };
    }
  }

  // Guard 2: status=done → verifikation = 'bestanden'
  if (taskUpdate.status === 'done' && taskUpdate.verifikation !== 'bestanden') {
    return { valid: false, error: 'Die Verifikation muss "bestanden" sein, um den Status auf "done" zu setzen.' };
  }

  // Guard 3: hasCycle(task.id, task.depends_on, allTasks)
  // BFS über depends_on (nicht DFS)
  if (taskUpdate.depends_on && taskUpdate.depends_on.length > 0 && taskUpdate.id) {
    if (hasCycle(taskUpdate.id, taskUpdate.depends_on, allTasks)) {
      return { valid: false, error: 'Zyklische Abhängigkeit erkannt.' };
    }
  }

  return { valid: true };
}

export const useTaskDB = {
  fetchTasks: async (projekt = null) => {
    try {
      let result;
      if (projekt) {
        result = await db.query(
          'SELECT * FROM task WHERE projekt = $projekt ORDER BY priorität DESC, erstellt DESC',
          { projekt }
        );
      } else {
        result = await db.query(
          'SELECT * FROM task ORDER BY priorität DESC, erstellt DESC'
        );
      }
      const data = result[0]?.result || result[0] || [];
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message || String(err) };
    }
  },

  createTask: async (data) => {
    try {
      const mergedData = {
        status: 'offen',
        risiko: 'medium',
        verifikation: 'ausstehend',
        akzeptanzkriterien: [],
        depends_on: [],
        ...data
      };
      
      const result = await db.query('CREATE task CONTENT $data', { data: mergedData });
      return { data: result[0]?.result?.[0] || result[0]?.[0], error: null };
    } catch (err) {
      return { data: null, error: err.message || String(err) };
    }
  },

  updateTask: async (id, data) => {
    try {
      // KEIN geändert im JS — DB setzt VALUE time::now() automatisch!
      const result = await db.query('UPDATE $id MERGE $data', { id, data });
      return { data: result[0]?.result?.[0] || result[0]?.[0], error: null };
    } catch (err) {
      return { data: null, error: err.message || String(err) };
    }
  },

  deleteTask: async (id) => {
    try {
      await db.query('DELETE $id', { id });
      return { data: true, error: null };
    } catch (err) {
      return { data: null, error: err.message || String(err) };
    }
  },

  subscribeTaskLive: async (callback) => {
    try {
      // Globale Subscription, kein Projekt-Filter
      const liveQuery = await db.live('task', callback);
      return {
        data: () => {
          if (liveQuery && typeof liveQuery.kill === 'function') {
            liveQuery.kill().catch(() => {});
          }
        },
        error: null
      };
    } catch (err) {
      return { data: null, error: err.message || String(err) };
    }
  }
};
