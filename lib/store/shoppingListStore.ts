import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShoppingItem } from '@/lib/types';

interface ShoppingListState {
  items: ShoppingItem[];
  addItem: (name: string, fromRecipe?: string) => void;
  addMultiple: (names: string[], fromRecipe?: string) => void;
  toggleItem: (id: string) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
}

export const useShoppingListStore = create<ShoppingListState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (name, fromRecipe) =>
        set((state) => ({
          items: [
            ...state.items,
            { id: Date.now().toString() + Math.random(), name, isChecked: false, fromRecipe },
          ],
        })),

      addMultiple: (names, fromRecipe) =>
        set((state) => {
          const newItems = names.map((name) => ({
            id: Date.now().toString() + Math.random() + name,
            name,
            isChecked: false,
            fromRecipe,
          }));
          return { items: [...state.items, ...newItems] };
        }),

      toggleItem: (id) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, isChecked: !item.isChecked } : item
          ),
        })),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      clearAll: () => set({ items: [] }),
    }),
    {
      name: 'pirinku_shopping_list_v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
