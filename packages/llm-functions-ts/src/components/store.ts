import { create } from 'zustand';

interface Store {
  selectedFnId?: string;
  setSelectedFn: (id: string) => void;
}

export const useStore = create<Store>((set) => ({
  selectedFnId: 'a86dd81ea956bb9396aad327e729dabfc5a6eea490284e47473ee3f8efada012',
  setSelectedFn: (id) => set(() => ({ selectedFnId: id })),
}));
