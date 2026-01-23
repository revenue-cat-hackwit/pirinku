import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image as RNImage,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2; // 2 columns with padding

// --- Dummy Data ---
// Menggunakan gambar Unsplash berkualitas tinggi
const FEED_DATA = [
  {
    id: '1',
    title: 'Salmon Teriyaki Healthy Bowl',
    image:
      'https://images.unsplash.com/photo-1467003909585-2f8a7270028d?q=80&w=1000&auto=format&fit=crop',
    user: {
      name: 'Chef Juna',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    likes: 1240,
    height: 250, // Simulasi tinggi berbeda untuk masonry
  },
  {
    id: '2',
    title: 'Pasta Carbonara Creamy',
    image:
      'https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=1000&auto=format&fit=crop',
    user: {
      name: 'Bella Cucina',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    },
    likes: 856,
    height: 300,
  },
  {
    id: '3',
    title: 'Avocado Toast & Egg',
    image:
      'https://images.unsplash.com/photo-1525351484163-7529414395d8?q=80&w=1000&auto=format&fit=crop',
    user: {
      name: 'Healthy Life',
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    },
    likes: 2100,
    height: 200,
  },
  {
    id: '4',
    title: 'Beef Burger Homemade',
    image:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1000&auto=format&fit=crop',
    user: {
      name: 'Burger King',
      avatar: 'https://randomuser.me/api/portraits/men/86.jpg',
    },
    likes: 5430,
    height: 280,
  },
  {
    id: '5',
    title: 'Berry Smoothie Bowl',
    image:
      'https://images.unsplash.com/photo-1557799552-45a82e4e794d?q=80&w=1000&auto=format&fit=crop',
    user: {
      name: 'Fit & Fab',
      avatar: 'https://randomuser.me/api/portraits/women/12.jpg',
    },
    likes: 340,
    height: 260,
  },
  {
    id: '6',
    title: 'Japanese Ramen',
    image:
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=1000&auto=format&fit=crop',
    user: {
      name: 'Ramen Guy',
      avatar: 'https://randomuser.me/api/portraits/men/11.jpg',
    },
    likes: 8900,
    height: 320,
  },
];

// --- Sub Components ---

const FeedCard = ({ item }: { item: (typeof FEED_DATA)[0] }) => (
  <View className="mb-4 rounded-2xl bg-white shadow-sm shadow-gray-200">
    {/* Image Container with Dynamic Height */}
    <View style={{ height: item.height, width: '100%' }} className="relative">
      <Image
        source={{ uri: item.image }}
        style={{ flex: 1, borderRadius: 16 }}
        contentFit="cover"
        transition={500}
      />

      {/* Like Button Overlay */}
      <TouchableOpacity className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-white/30 backdrop-blur-sm">
        <Ionicons name="heart-outline" size={18} color="white" />
      </TouchableOpacity>
    </View>

    {/* Content */}
    <View className="p-3">
      <Text className="mb-2 font-visby-bold text-sm leading-tight text-gray-900">{item.title}</Text>

      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center">
          <Image
            source={{ uri: item.user.avatar }}
            style={{ width: 20, height: 20, borderRadius: 10 }}
          />
          <Text className="ml-2 truncate font-visby text-xs text-gray-500" numberOfLines={1}>
            {item.user.name}
          </Text>
        </View>

        <View className="ml-2 flex-row items-center">
          <Ionicons name="heart" size={10} color="#FF6B6B" />
          <Text className="ml-1 font-visby text-[10px] text-gray-400">
            {item.likes > 1000 ? (item.likes / 1000).toFixed(1) + 'k' : item.likes}
          </Text>
        </View>
      </View>
    </View>
  </View>
);

export default function Feed() {
  const [activeCategory, setActiveCategory] = useState('For You');

  // Split data into two columns nicely
  const leftColumn = FEED_DATA.filter((_, i) => i % 2 === 0);
  const rightColumn = FEED_DATA.filter((_, i) => i % 2 !== 0);

  const categories = ['For You', 'Following', 'Sarapan', 'Diet', 'Pedas'];

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      {/* Header */}
      <View className="z-10 mb-4 rounded-b-[24px] bg-white px-5 pb-4 pt-2 shadow-sm shadow-gray-100">
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <Text className="font-visby text-sm text-gray-500">Selamat Pagi,</Text>
            <Text className="font-visby-bold text-2xl text-gray-900">Pirinku Social</Text>
          </View>
          <TouchableOpacity className="rounded-full border border-gray-100 bg-gray-50 p-2">
            <Ionicons name="notifications-outline" size={22} color="black" />
          </TouchableOpacity>
        </View>

        {/* Search Bar Visual Only */}
        <View className="mb-4 flex-row items-center rounded-full bg-gray-100 px-4 py-3">
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <Text className="ml-2 font-visby text-gray-400">Cari resep viral...</Text>
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
          {categories.map((cat, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => setActiveCategory(cat)}
              className={`mr-2 rounded-full border px-5 py-2 ${
                activeCategory === cat
                  ? 'border-[#1E1F20] bg-[#1E1F20]'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <Text
                className={`font-visby text-sm ${
                  activeCategory === cat ? 'text-white' : 'text-gray-600'
                }`}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Feed Content - Masonry Layout */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row justify-between">
          {/* Left Column */}
          <View style={{ width: COLUMN_WIDTH }}>
            {leftColumn.map((item) => (
              <FeedCard key={item.id} item={item} />
            ))}
          </View>

          {/* Right Column */}
          <View style={{ width: COLUMN_WIDTH }}>
            {rightColumn.map((item) => (
              <FeedCard key={item.id} item={item} />
            ))}

            {/* Promo Card Inserted in Right Column */}
            <View className="mb-4 h-[200px] items-center justify-center rounded-2xl bg-[#CC5544] p-4">
              <Ionicons name="sparkles" size={32} color="white" />
              <Text className="mt-2 text-center font-visby-bold text-lg text-white">
                Buat Resep?
              </Text>
              <Text className="mb-3 text-center font-visby text-xs text-white/80">
                Bagikan inspirasi masakanmu ke dunia!
              </Text>
              <TouchableOpacity className="rounded-full bg-white px-4 py-2">
                <Text className="font-visby-bold text-xs text-[#CC5544]">Mulai Masak</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button (FAB) + Post */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-[#1E1F20] shadow-lg shadow-black/30"
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
