import { create } from "zustand";

// Example of a simple store
type BearState = {
  bears: number;
  increase: () => void;
  reset: () => void;
};

export const useBearStore = create<BearState>((set) => ({
  bears: 0,
  increase: () => set((state) => ({ bears: state.bears + 1 })),
  reset: () => set({ bears: 0 }),
}));
