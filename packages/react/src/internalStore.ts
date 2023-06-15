import { create } from 'zustand';

export interface InternalStore {
  enableTableView: boolean;
  toggleEnableTableView: () => void;
  expandLevel: 10 | 0;
  toggleExpandLevel: () => void;
}

export const useInternalStore = create<InternalStore>((set) => {
  return {
    enableTableView: false,
    toggleEnableTableView: () =>
      set((prev) => {
        return { enableTableView: !prev.enableTableView };
      }),
    expandLevel: 0,
    toggleExpandLevel: () =>
      set((prev) => {
        return { expandLevel: prev.expandLevel === 0 ? 10 : 0 };
      }),
  };
});
