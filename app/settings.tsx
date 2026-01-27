import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LanguageSelector } from '@/components/LanguageSelector';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { useAuthStore } from '@/lib/store/authStore';

export default function SettingsScreen() {
  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await useAuthStore.getState().signOut();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center border-b border-gray-100 px-4 pb-4 pt-2">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="chevron-back" size={28} color="black" />
        </TouchableOpacity>
        <Text className="font-visby-bold text-xl text-black">Settings</Text>
      </View>

      <ScrollView className="flex-1 p-6">
        {/* Subscription Component */}
        <SubscriptionCard />

        {/* Section: App Settings */}
        <View className="mb-8">
          <Text className="mb-4 font-visby-bold text-lg text-gray-900">Preferences</Text>
          <LanguageSelector />
        </View>

        {/* Section: Account */}
        <View className="mb-8">
          <Text className="mb-4 font-visby-bold text-lg text-gray-900">Account</Text>

          <TouchableOpacity
            onPress={handleSignOut}
            className="flex-row items-center justify-between rounded-2xl border border-red-100 bg-red-50 p-4"
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="log-out-outline" size={24} color="#EF4444" />
              <Text className="font-visby-bold text-base text-red-500">Sign Out</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <View className="mt-auto items-center">
          <Text className="font-visby text-xs text-gray-400">Pirinku v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
