import { Execution, LogsProvider } from '../llm';

export const localStorageLogs: LogsProvider = {
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
      return (
        JSON.parse(localStorage?.getItem('llm-functions-logs') || 'null') || []
      );
    } else {
      return [];
    }
  },
};
