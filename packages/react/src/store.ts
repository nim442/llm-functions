import { create } from 'zustand';

interface Store {
  selectedFnId?: string;
  setSelectedFn: (id: string) => void;
}

export const useStore = create<Store>((set) => ({
  selectedFnId: undefined,
  setSelectedFn: (id) => set(() => ({ selectedFnId: id })),
}));
