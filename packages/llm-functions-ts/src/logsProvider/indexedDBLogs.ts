import { sortBy } from 'lodash';
import { Execution, LogsProvider } from '../llm';
import { openDB } from 'idb';
export const indexedDBLogs: LogsProvider = {
  getLogsByFunctionId: async (id) => {
    if (typeof window !== 'undefined') {
      const db = await openDB('llm-functions-logs', 1, {
        upgrade(db) {
          db.createObjectStore('logs', { autoIncrement: false });
        },
      });
      if (!db.objectStoreNames.contains('logs')) {
        return [];
      }
      const logs = await db.getAll('logs');
      const sortedLogs: Execution<unknown>[] = logs.map((l) => JSON.parse(l));
      const filteredLogs = sortedLogs.filter((s) =>
        s.functionsExecuted.find((f) => f.functionDef.id === id)
      );
      return sortBy(filteredLogs, (s) => new Date(s.createdAt));
    } else {
      return [];
    }
  },

  saveLog: async (e) => {
    if (typeof window !== 'undefined') {
      const db = await openDB('llm-functions-logs', 1, {
        upgrade(db) {
          db.createObjectStore('logs', { autoIncrement: false });
        },
      });

      await db.put('logs', JSON.stringify(e), e.id);
    }
  },
  getLogs: async () => {
    if (typeof window !== 'undefined') {
      const db = await openDB('llm-functions-logs', 1, {
        upgrade(db) {
          db.createObjectStore('logs', { autoIncrement: false });
        },
      });
      if (!db.objectStoreNames.contains('logs')) {
        return [];
      }
      const logs = await db.getAll('logs');
      const parsedLogs = logs.map((l) => JSON.parse(l));

      return sortBy(parsedLogs, (s) => new Date(s.createdAt));
    } else {
      return [];
    }
  },
};
