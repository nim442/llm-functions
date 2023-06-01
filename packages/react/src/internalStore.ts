import { create } from 'zustand';
export const TABS = ['PLAYGROUND', 'DATASET', 'LOGS'] as const;
export const tabsLabels: Record<(typeof TABS)[number], string> = {
  PLAYGROUND: 'Playground',
  DATASET: 'Dataset',
  LOGS: 'Logs',
};

export interface InternalStore {
  enableTableView: boolean;
  toggleEnableTableView: () => void;
}

export const useInternalStore = create<InternalStore>((set) => {
  return {
    enableTableView: false,
    toggleEnableTableView: () =>
      set((prev) => {
        return { enableTableView: !prev.enableTableView };
      }),
  };
});
