import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPreferences } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface PreferencesState {
  hasOnboarded: boolean;
  preferences: UserPreferences;
  isLoading: boolean;
  toggleCuisine: (cuisine: string) => Promise<void>;
  toggleTastePreference: (preference: string) => Promise<void>;
  toggleAllergy: (allergy: string) => Promise<void>;
  toggleEquipment: (tool: string) => Promise<void>;
  setDietGoal: (goal: string) => Promise<void>;
  completeOnboarding: () => void;
  sync: () => Promise<void>; // Fetch from cloud
}

const DEFAULT_PREFERENCES: UserPreferences = {
  cuisines: [],
  tastePreferences: [],
  allergies: [],
  equipment: ['Stove', 'Pan', 'Knife'], // Default basics
  dietGoal: 'balanced',
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      hasOnboarded: false,
      preferences: DEFAULT_PREFERENCES,
      isLoading: false,

      completeOnboarding: () => set({ hasOnboarded: true }),

      toggleCuisine: async (cuisine) => {
        // 1. Optimistic Update
        const state = get();
        const exists = state.preferences.cuisines.includes(cuisine);
        const newCuisines = exists
          ? state.preferences.cuisines.filter((c) => c !== cuisine)
          : [...state.preferences.cuisines, cuisine];

        set((s) => ({
          preferences: { ...s.preferences, cuisines: newCuisines },
        }));

        // 2. Cloud Update
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase
            .from('profiles')
            .update({ cuisines: newCuisines })
            .eq('id', session.user.id);
        }
      },

      toggleTastePreference: async (preference) => {
        // 1. Optimistic Update
        const state = get();
        const exists = state.preferences.tastePreferences.includes(preference);
        const newTastePreferences = exists
          ? state.preferences.tastePreferences.filter((t) => t !== preference)
          : [...state.preferences.tastePreferences, preference];

        set((s) => ({
          preferences: { ...s.preferences, tastePreferences: newTastePreferences },
        }));

        // 2. Cloud Update
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase
            .from('profiles')
            .update({ taste_preferences: newTastePreferences })
            .eq('id', session.user.id);
        }
      },

      sync: async () => {
        set({ isLoading: true });
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session?.user) return;

          const { data, error } = await supabase
            .from('profiles')
            .select('diet_goal, cuisines, taste_preferences, allergies, equipment')
            .eq('id', session.user.id)
            .single();

          if (data && !error) {
            set((state) => ({
              preferences: {
                ...state.preferences,
                dietGoal: data.diet_goal || state.preferences.dietGoal,
                cuisines: data.cuisines || [],
                tastePreferences: data.taste_preferences || [],
                allergies: data.allergies || [],
                equipment: data.equipment || [],
              },
            }));
          }
        } catch (e) {
          console.error('Preferences Sync Error:', e);
        } finally {
          set({ isLoading: false });
        }
      },

      toggleAllergy: async (allergy) => {
        // 1. Optimistic Update
        const state = get();
        const exists = state.preferences.allergies.includes(allergy);
        const newAllergies = exists
          ? state.preferences.allergies.filter((a) => a !== allergy)
          : [...state.preferences.allergies, allergy];

        set((s) => ({
          preferences: { ...s.preferences, allergies: newAllergies },
        }));

        // 2. Cloud Update
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase
            .from('profiles')
            .update({ allergies: newAllergies })
            .eq('id', session.user.id);
        }
      },

      toggleEquipment: async (tool) => {
        // 1. Optimistic Update
        const state = get();
        const exists = state.preferences.equipment.includes(tool);
        const newEquipment = exists
          ? state.preferences.equipment.filter((t) => t !== tool)
          : [...state.preferences.equipment, tool];

        set((s) => ({
          preferences: { ...s.preferences, equipment: newEquipment },
        }));

        // 2. Cloud Update
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase
            .from('profiles')
            .update({ equipment: newEquipment })
            .eq('id', session.user.id);
        }
      },

      setDietGoal: async (goal) => {
        // 1. Optimistic
        set((s) => ({
          preferences: { ...s.preferences, dietGoal: goal },
        }));

        // 2. Cloud
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase.from('profiles').update({ diet_goal: goal }).eq('id', session.user.id);
        }
      },
    }),
    {
      name: 'pirinku_user_prefs_v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
