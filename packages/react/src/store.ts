import { create } from 'zustand';
export const TABS = ['PLAYGROUND', 'DATASET', 'LOGS'] as const;
export const tabsLabels: Record<(typeof TABS)[number], string> = {
  PLAYGROUND: 'Playground',
  DATASET: 'Dataset',
  LOGS: 'Logs',
};

export interface Store {
  functionId?: string;
  setSelectedFunctionId: (id: string) => void;
  selectedTab: (typeof TABS)[number];
  setSelectedTab: (arg: Store['selectedTab']) => void;
}

export const useStore = create<Store>((set) => {
  return {
    functionId: undefined,
    setSelectedFunctionId: (id) =>
      set(() => {
        return { functionId: id };
      }),
    selectedTab: 'PLAYGROUND',
    setSelectedTab: (tab) =>
      set(() => {
        return { selectedTab: tab };
      }),
  };
});
