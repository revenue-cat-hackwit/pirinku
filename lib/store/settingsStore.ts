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

  // Voice Settings (Cooking Mode)
  voiceId: string;
  setVoiceId: (id: string) => Promise<void>;
  loadVoiceId: () => Promise<void>;

  voiceSpeed: number;
  setVoiceSpeed: (speed: number) => Promise<void>;
  loadVoiceSpeed: () => Promise<void>;
}

const LANGUAGE_STORAGE_KEY = '@pirinku_language';
const THEME_STORAGE_KEY = '@pirinku_theme';
const VOICE_ID_STORAGE_KEY = '@pirinku_voice_id';
const VOICE_SPEED_STORAGE_KEY = '@pirinku_voice_speed';

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

  // Voice Settings Implementation
  voiceId: 'Wise_Woman',
  setVoiceId: async (id: string) => {
    try {
      await AsyncStorage.setItem(VOICE_ID_STORAGE_KEY, id);
      set({ voiceId: id });
    } catch (e) {
      console.error('Failed to save voice ID', e);
    }
  },
  loadVoiceId: async () => {
    try {
      const saved = await AsyncStorage.getItem(VOICE_ID_STORAGE_KEY);
      if (saved) set({ voiceId: saved });
    } catch (e) {}
  },

  voiceSpeed: 1.0,
  setVoiceSpeed: async (speed: number) => {
    try {
      await AsyncStorage.setItem(VOICE_SPEED_STORAGE_KEY, speed.toString());
      set({ voiceSpeed: speed });
    } catch (e) {
      console.error('Failed to save voice speed', e);
    }
  },
  loadVoiceSpeed: async () => {
    try {
      const saved = await AsyncStorage.getItem(VOICE_SPEED_STORAGE_KEY);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed)) set({ voiceSpeed: parsed });
      }
    } catch (e) {}
  },
}));
