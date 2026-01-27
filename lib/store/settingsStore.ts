import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SupportedLanguage = 'id' | 'en' | 'auto';
export type ThemeOption = 'light' | 'dark';

interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'auto', label: 'Auto Detect', flag: '🌐' },
  { code: 'id', label: 'Indonesian', flag: '🇮🇩' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

interface SettingsState {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  loadLanguage: () => Promise<void>;
  theme: ThemeOption;
  setTheme: (theme: ThemeOption) => Promise<void>;
  loadTheme: () => Promise<void>;
}

const LANGUAGE_STORAGE_KEY = '@pirinku_language';
const THEME_STORAGE_KEY = '@pirinku_theme';

export const useSettingsStore = create<SettingsState>((set) => ({
  language: 'en', // Default to English

  setLanguage: async (lang: SupportedLanguage) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      set({ language: lang });
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  },

  loadLanguage: async () => {
    try {
      const savedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLang && ['id', 'en', 'auto'].includes(savedLang)) {
        set({ language: savedLang as SupportedLanguage });
      }
    } catch (error) {
      console.error('Failed to load language preference:', error);
    }
  },

  theme: 'light',
  setTheme: async (newTheme: ThemeOption) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      set({ theme: newTheme });
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  },
  loadTheme: async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
        set({ theme: savedTheme as ThemeOption });
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
  },
}));
