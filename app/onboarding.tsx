import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePreferencesStore } from '@/lib/store/preferencesStore';

const ALLERGIES_OPT = ['Peanuts', 'Seafood', 'Dairy', 'Gluten', 'Eggs', 'Soy'];
const EQUIPMENT_OPT = ['Oven', 'Blender', 'Air Fryer', 'Microwave', 'Mixer', 'Stove', 'Knife'];

export default function OnboardingScreen() {
  const router = useRouter();
  const { preferences, toggleAllergy, toggleEquipment, completeOnboarding } = usePreferencesStore();

  const handleFinish = () => {
    completeOnboarding();
    router.replace('/(tabs)/feed');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 pt-10">
        
        {/* Header */}
        <View className="items-center mb-10">
            <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="restaurant" size={40} color="#CC5544" />
            </View>
            <Text className="font-visby-bold text-3xl text-gray-900 text-center mb-2">Welcome Chef! 👨‍🍳</Text>
            <Text className="font-visby text-gray-500 text-center px-4">
                Let's personalize your kitchen experience. Tell us what you have and what you avoid.
            </Text>
        </View>

        {/* 1. Allergies */}
        <View className="mb-8">
            <Text className="font-visby-bold text-lg text-gray-900 mb-4">⛔ Allergies / Restrictions</Text>
            <View className="flex-row flex-wrap gap-3">
                {ALLERGIES_OPT.map((item) => {
                    const isSelected = preferences.allergies.includes(item);
                    return (
                        <TouchableOpacity
                            key={item}
                            onPress={() => toggleAllergy(item)}
                            className={`rounded-full px-5 py-3 border ${isSelected ? 'bg-red-500 border-red-500' : 'bg-gray-50 border-gray-200'}`}
                        >
                            <Text className={`font-visby-bold text-sm ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    )
                })}
            </View>
        </View>

        {/* 2. Equipment */}
        <View className="mb-10">
            <Text className="font-visby-bold text-lg text-gray-900 mb-4">🔪 Kitchen Equipment</Text>
            <View className="flex-row flex-wrap gap-3">
                {EQUIPMENT_OPT.map((item) => {
                    const isSelected = preferences.equipment.includes(item);
                    return (
                        <TouchableOpacity
                            key={item}
                            onPress={() => toggleEquipment(item)}
                            className={`rounded-full px-5 py-3 border ${isSelected ? 'bg-black border-black' : 'bg-gray-50 border-gray-200'}`}
                        >
                            <Text className={`font-visby-bold text-sm ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    )
                })}
            </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
            onPress={handleFinish}
            className="w-full bg-[#CC5544] py-4 rounded-2xl shadow-lg shadow-red-200 mb-10 flex-row items-center justify-center"
        >
            <Text className="font-visby-bold text-white text-lg mr-2">Let's Cook</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
