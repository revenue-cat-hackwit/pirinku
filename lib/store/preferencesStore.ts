import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPreferences } from '@/lib/types';

interface PreferencesState {
  hasOnboarded: boolean;
  preferences: UserPreferences;
  toggleAllergy: (allergy: string) => void;
  toggleEquipment: (tool: string) => void;
  setDietGoal: (goal: string) => void;
  completeOnboarding: () => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  allergies: [],
  equipment: ['Stove', 'Pan', 'Knife'], // Default basics
  dietGoal: 'balanced',
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      hasOnboarded: false,
      preferences: DEFAULT_PREFERENCES,

      completeOnboarding: () => set({ hasOnboarded: true }),

      toggleAllergy: (allergy) =>
        set((state) => {
          const exists = state.preferences.allergies.includes(allergy);
          return {
            preferences: {
              ...state.preferences,
              allergies: exists
                ? state.preferences.allergies.filter((a) => a !== allergy)
                : [...state.preferences.allergies, allergy],
            },
          };
        }),

      toggleEquipment: (tool) =>
        set((state) => {
          const exists = state.preferences.equipment.includes(tool);
          return {
            preferences: {
              ...state.preferences,
              equipment: exists
                ? state.preferences.equipment.filter((t) => t !== tool)
                : [...state.preferences.equipment, tool],
            },
          };
        }),

      setDietGoal: (goal) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            dietGoal: goal,
          },
        })),
    }),
    {
      name: 'pirinku_user_prefs_v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
