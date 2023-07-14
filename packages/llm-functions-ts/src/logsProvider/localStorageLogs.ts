import { Execution, LogsProvider } from '../llm';

export const localStorageLogs: LogsProvider = {
  getLogsByFunctionId: (id) => {
    if (typeof window !== 'undefined') {
      const prevLogs: Execution<any>[] =
        JSON.parse(localStorage?.getItem('llm-functions-logs') || 'null') || [];
      const filteredLogs = prevLogs.filter((s) =>
        s.functionsExecuted.find((f) => f.functionDef.id === id)
      );
      return Promise.resolve(filteredLogs);
    } else {
      return Promise.resolve([]);
    }
  },

  saveLog: (e) => {
    if (typeof window !== 'undefined') {
      const prevLogs: Execution<any>[] =
        JSON.parse(localStorage?.getItem('llm-functions-logs') || 'null') || [];
      const existingLogIdx = prevLogs.findIndex((l) => l.id === e.id);
      const newLogs =
        existingLogIdx === -1
          ? [...prevLogs, e]
          : prevLogs.map((l, idx) => (idx === existingLogIdx ? e : l));

      localStorage?.setItem('llm-functions-logs', JSON.stringify(newLogs));
    }
  },
  getLogs: () => {
    if (typeof window !== 'undefined') {
      return Promise.resolve(
        JSON.parse(localStorage?.getItem('llm-functions-logs') || 'null') || []
      );
    } else {
      return Promise.resolve([]);
    }
  },
};
