import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore, ThemeOption } from '@/lib/store/settingsStore';

export const ThemeSelector = () => {
  const { theme, setTheme } = useSettingsStore();

  const handleSelect = (selectedTheme: ThemeOption) => {
    setTheme(selectedTheme);
  };

  const options: { value: ThemeOption; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: 'sunny' },
    { value: 'dark', label: 'Dark', icon: 'moon' },
  ];

  return (
    <View className="mb-6">
      <Text className="mb-3 font-visby-bold text-sm text-gray-500 dark:text-gray-400">Appearance</Text>
      <View className="flex-row rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
        {options.map((opt) => {
            const isActive = theme === opt.value;
            return (
                <TouchableOpacity
                    key={opt.value}
                    onPress={() => handleSelect(opt.value)}
                    className={`flex-1 flex-row items-center justify-center rounded-lg py-2.5 ${
                        isActive ? 'bg-white dark:bg-gray-700' : 'bg-transparent'
                    }`}
                    style={isActive ? {
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 2
                    } : undefined}
                >
                    <Ionicons 
                        name={opt.icon as any} 
                        size={16} 
                        color={isActive ? (theme === 'dark' ? 'white' : 'black') : '#9CA3AF'} 
                        style={{ marginRight: 6 }}
                    />
                    <Text className={`font-visby-bold text-xs ${isActive ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                        {opt.label}
                    </Text>
                </TouchableOpacity>
            )
        })}
      </View>
    </View>
  );
};
