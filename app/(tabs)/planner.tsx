import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

// Dummy Dates Generator (Next 7 days)
const getDays = () => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      date: d.getDate(),
      day: d.toLocaleDateString('id-ID', { weekday: 'short' }),
      fullDate: d,
      active: i === 0,
    });
  }
  return days;
};

// Dummy Meal Data
const MEALS = [
  {
    type: 'Sarapan',
    time: '07:00',
    title: 'Roti Bakar Alpukat',
    cal: 320,
    img: 'https://images.unsplash.com/photo-1525351484163-7529414395d8?q=80&w=200&auto=format&fit=crop',
  },
  {
    type: 'Makan Siang',
    time: '12:30',
    title: 'Nasi Ayam Hainan',
    cal: 650,
    img: 'https://images.unsplash.com/photo-1529369623266-f5264b696110?q=80&w=200&auto=format&fit=crop',
  },
  {
    type: 'Makan Malam',
    time: '19:00',
    title: 'Salad Sayur Tuna',
    cal: 280,
    img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200&auto=format&fit=crop',
  },
];

export default function MealPlanner() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const days = getDays();

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="mb-6 px-6 pt-2">
        <Text className="font-visby text-sm text-gray-500">Jadwal Masak</Text>
        <View className="flex-row items-center justify-between">
          <Text className="font-visby-bold text-2xl text-gray-900">Minggu Ini</Text>
          <TouchableOpacity className="flex-row items-center gap-2 rounded-full bg-black px-4 py-2">
            <Ionicons name="sparkles" size={16} color="#FFD700" />
            <Text className="font-visby-bold text-xs text-white">Auto Plan</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Calendar Strip */}
      <View className="mb-6">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24 }}
        >
          {days.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => setSelectedIdx(idx)}
              className={`mr-3 h-20 w-16 items-center justify-center rounded-2xl border ${
                selectedIdx === idx
                  ? 'border-[#CC5544] bg-[#CC5544] shadow-lg shadow-red-200'
                  : 'border-gray-100 bg-gray-50'
              }`}
            >
              <Text
                className={`mb-1 font-visby text-xs ${selectedIdx === idx ? 'text-white/80' : 'text-gray-400'}`}
              >
                {item.day}
              </Text>
              <Text
                className={`font-visby-bold text-xl ${selectedIdx === idx ? 'text-white' : 'text-gray-900'}`}
              >
                {item.date}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Meal Timeline */}
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }}>
        {MEALS.map((meal, idx) => (
          <View key={idx} className="mb-6 flex-row">
            {/* Time Indicator */}
            <View className="mr-4 w-12 items-center pt-4">
              <Text className="mb-1 font-visby-bold text-gray-900">{meal.time}</Text>
              <View className="h-full w-[1px] bg-gray-200" />
            </View>

            {/* Card */}
            <TouchableOpacity className="flex-1 flex-row rounded-2xl border border-gray-100 bg-white p-3 shadow-sm shadow-gray-100">
              <Image
                source={{ uri: meal.img }}
                style={{ width: 80, height: 80, borderRadius: 12 }}
              />
              <View className="ml-3 flex-1 justify-center">
                <View className="mb-1 flex-row items-center">
                  <View className="self-start rounded-md bg-orange-100 px-2 py-0.5">
                    <Text className="font-visby-bold text-[10px] text-orange-600">{meal.type}</Text>
                  </View>
                </View>
                <Text className="mb-1 font-visby-bold text-base text-gray-900" numberOfLines={2}>
                  {meal.title}
                </Text>
                <Text className="font-visby text-xs text-gray-400">🔥 {meal.cal} Kcal</Text>
              </View>
              <TouchableOpacity className="absolute right-3 top-3">
                <Ionicons name="ellipsis-horizontal" size={20} color="#ccc" />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        ))}

        {/* Add Snack / Extra Button */}
        <TouchableOpacity className="ml-16 mt-2 flex-row items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 p-4">
          <Ionicons name="add" size={20} color="#999" />
          <Text className="ml-2 font-visby-bold text-gray-400">Tambah Cemilan</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
