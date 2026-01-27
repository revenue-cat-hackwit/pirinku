import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Share,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Recipe } from '@/lib/types';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useShoppingListStore } from '@/lib/store/shoppingListStore';

const RECIPES_STORAGE_KEY = 'pirinku_local_recipes_v1';

export default function SavedRecipesScreen() {
  const router = useRouter(); 
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  
  // EDIT MODE STATES
  const [isEditing, setIsEditing] = useState(false);
  const [tempRecipe, setTempRecipe] = useState<Recipe | null>(null);
  
  // Store
  const addToShoppingList = useShoppingListStore((state) => state.addMultiple);

  const loadRecipes = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(RECIPES_STORAGE_KEY);
      if (jsonValue != null) {
        setRecipes(JSON.parse(jsonValue));
      } else {
        setRecipes([]);
      }
    } catch (e) {
      console.error('Failed to load recipes', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRecipes();
    }, []),
  );

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await loadRecipes();
    setRefreshing(false);
  };

  const handleDelete = async (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Hapus Resep', 'Yakin ingin menghapus resep ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          const newRecipes = recipes.filter((r) => r.id !== id);
          setRecipes(newRecipes);
          await AsyncStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(newRecipes));
          if (selectedRecipe?.id === id) setSelectedRecipe(null);
          
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleAddIngredientsToShoppingList = () => {
    if (selectedRecipe) {
        addToShoppingList(selectedRecipe.ingredients, selectedRecipe.title);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Sukses', 'Bahan masakan telah ditambahkan ke Daftar Belanja!');
    }
  };

  const handleShare = async () => {
    if (!selectedRecipe) return;

    const ingredientsList = selectedRecipe.ingredients.map(i => `• ${i}`).join('\n');
    const stepsList = selectedRecipe.steps.map(s => `${s.step}. ${s.instruction}`).join('\n\n');

    const message = `🍳 *${selectedRecipe.title}*\n\n` +
      `⏱️ Waktu: ${selectedRecipe.time_minutes}m | 🔥 Kalori: ${selectedRecipe.calories_per_serving}\n\n` +
      `🛒 *Bahan-bahan:*\n${ingredientsList}\n\n` +
      `👨‍🍳 *Cara Membuat:*\n${stepsList}\n\n` +
      `_Dibuat dengan Aplikasi Pirinku_ 📲`;

    try {
      await Share.share({
        message: message,
      });
    } catch (error) {
      console.error(error);
    }
  };

  // --- EDIT HANDLERS ---
  const handleStartEdit = () => {
    if (selectedRecipe) {
        setTempRecipe({...selectedRecipe}); // Clone
        setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!tempRecipe || !selectedRecipe) return;
    
    // Update List
    const newRecipes = recipes.map(r => r.id === selectedRecipe.id ? tempRecipe : r);
    setRecipes(newRecipes);
    await AsyncStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(newRecipes));
    
    // Update Selection
    setSelectedRecipe(tempRecipe);
    setIsEditing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Sukses', 'Resep berhasil diperbarui!');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setTempRecipe(null);
  }

  // --- Render Modal ---
  const renderDetailModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={!!selectedRecipe}
      onRequestClose={() => {
        setSelectedRecipe(null); 
        setIsEditing(false);
      }}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="h-[90%] rounded-t-3xl bg-white p-6">
          <View className="mb-4 flex-row items-center justify-between">
            {/* HEADer EDIT LOGIC */}
            {isEditing ? (
                 <Text className="flex-1 font-visby-bold text-xl text-gray-900">Editing Recipe...</Text>
            ) : (
                 <Text className="flex-1 pr-2 font-visby-bold text-2xl text-gray-900" numberOfLines={2}>
                    {selectedRecipe?.title}
                 </Text>
            )}

            <View className="flex-row gap-2">
                {isEditing ? (
                    <TouchableOpacity onPress={handleSaveEdit} className="rounded-full bg-green-500 p-2">
                        <Ionicons name="checkmark" size={24} color="white" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={handleShare} className="rounded-full bg-blue-50 p-2">
                        <Ionicons name="share-social" size={24} color="#3B82F6" />
                    </TouchableOpacity>
                )}

                {isEditing ? (
                    <TouchableOpacity onPress={handleCancelEdit} className="rounded-full bg-red-100 p-2">
                        <Ionicons name="close" size={24} color="red" />
                    </TouchableOpacity>
                ) : (
                    <>
                        <TouchableOpacity onPress={handleStartEdit} className="rounded-full bg-amber-50 p-2">
                            <Ionicons name="pencil" size={24} color="#F59E0B" />
                        </TouchableOpacity>
                        <TouchableOpacity
                        onPress={() => setSelectedRecipe(null)}
                        className="rounded-full bg-gray-100 p-2"
                        >
                        <Ionicons name="close" size={24} color="black" />
                        </TouchableOpacity>
                    </>
                )}
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* EDITABLE TITLE */}
            {isEditing && (
                <View className="mb-4">
                    <Text className="text-xs text-gray-400 font-visby-bold mb-1">TITLE</Text>
                    <TextInput
                        value={tempRecipe?.title}
                        onChangeText={(txt) => setTempRecipe(prev => prev ? {...prev, title: txt} : null)}
                        className="border border-gray-300 rounded-lg p-3 font-visby-bold text-lg"
                    />
                </View>
            )}

            {/* EDITABLE DESCRIPTION */}
            {isEditing ? (
                <View className="mb-6">
                    <Text className="text-xs text-gray-400 font-visby-bold mb-1">DESCRIPTION</Text>
                    <TextInput
                        value={tempRecipe?.description}
                        onChangeText={(txt) => setTempRecipe(prev => prev ? {...prev, description: txt} : null)}
                        multiline
                        className="border border-gray-300 rounded-lg p-3 font-visby text-base h-24"
                        textAlignVertical="top"
                    />
                </View>
            ) : (
                <Text className="mb-6 font-visby text-base text-gray-500">
                {selectedRecipe?.description}
                </Text>
            )}

            {/* Stats (Read Only for now) */}
            <View className="mb-6 flex-row justify-between rounded-2xl bg-gray-50 p-4">
              <View className="items-center">
                <Text className="font-visby-bold text-gray-800">
                  {selectedRecipe?.time_minutes}m
                </Text>
                <Text className="text-xs text-gray-400">Waktu</Text>
              </View>
              <View className="w-[1px] bg-gray-200" />
              <View className="items-center">
                <Text className="font-visby-bold text-gray-800">
                  {selectedRecipe?.calories_per_serving}
                </Text>
                <Text className="text-xs text-gray-400">Kalori</Text>
              </View>
              <View className="w-[1px] bg-gray-200" />
              <View className="items-center">
                <Text className="font-visby-bold text-gray-800">{selectedRecipe?.servings}</Text>
                <Text className="text-xs text-gray-400">Porsi</Text>
              </View>
            </View>

            {/* Ingredients Header with Add Button (Not Editable yet) */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3 border-b border-gray-100 pb-2">
                  <Text className="font-visby-bold text-lg text-gray-900">
                    🛒 Bahan Utama {isEditing && <Text className="text-xs text-red-400">(Read Only)</Text>}
                  </Text>
                  {!isEditing && (
                    <TouchableOpacity onPress={handleAddIngredientsToShoppingList}>
                        <Text className="font-visby-bold text-xs text-[#CC5544]">+ Add to List</Text>
                    </TouchableOpacity>
                  )}
              </View>

              {selectedRecipe?.ingredients.map((item, i) => (
                <View key={i} className="mb-2 flex-row items-start">
                  <Text className="mr-2 text-red-500">•</Text>
                  <Text className="font-visby text-base text-gray-700">{item}</Text>
                </View>
              ))}
            </View>

            {/* Steps (Not Editable yet) */}
            <View className="mb-8">
              <Text className="mb-3 border-b border-gray-100 pb-2 font-visby-bold text-lg text-gray-900">
                👨‍🍳 Cara Membuat {isEditing && <Text className="text-xs text-red-400">(Read Only)</Text>}
              </Text>
              {selectedRecipe?.steps.map((step, i) => (
                <View key={i} className="mb-4 flex-row">
                  <View className="mr-3 h-6 w-6 items-center justify-center rounded-full bg-red-100">
                    <Text className="font-visby-bold text-xs text-red-600">{step.step}</Text>
                  </View>
                  <Text className="flex-1 font-visby text-base leading-6 text-gray-700">
                    {step.instruction}
                  </Text>
                </View>
              ))}
            </View>

            {/* Tips (Editable) */}
            {(isEditing || selectedRecipe?.tips) && (
              <View className="mb-8 rounded-xl border border-amber-100 bg-amber-50 p-4">
                <Text className="mb-1 font-visby-bold text-amber-800">💡 Tips Chef</Text>
                {isEditing ? (
                    <TextInput
                        value={tempRecipe?.tips}
                        onChangeText={(txt) => setTempRecipe(prev => prev ? {...prev, tips: txt} : null)}
                        multiline
                        className="bg-white/50 border border-amber-200 rounded p-2 text-amber-900" 
                    />
                ) : (
                    <Text className="font-visby text-amber-700">{selectedRecipe?.tips}</Text>
                )}
              </View>
            )}

            {!isEditing && (
                <TouchableOpacity
                onPress={() => handleDelete(selectedRecipe!.id!)}
                className="mb-8 flex-row items-center justify-center rounded-xl border border-red-100 bg-red-50 py-4"
                >
                <Ionicons name="trash-outline" size={20} color="#EF4444" className="mr-2" />
                <Text className="ml-2 font-visby-bold text-red-500">Hapus Resep Ini</Text>
                </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
        <Text className="font-visby-bold text-3xl text-gray-900">Koleksi Resep 📚</Text>
        <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.push('/shopping-list')}
              className="rounded-full border border-gray-100 bg-white p-2 shadow-sm"
            >
              <Ionicons name="cart-outline" size={20} color="#CC5544" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onRefresh}
              className="rounded-full border border-gray-100 bg-white p-2 shadow-sm"
            >
              <Ionicons name="refresh" size={20} color="#666" />
            </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-2"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {recipes.length === 0 ? (
          <View className="mt-20 items-center justify-center opacity-70">
            <Ionicons name="book-outline" size={80} color="#ccc" />
            <Text className="mt-4 font-visby-bold text-lg text-gray-500">
              No recipes saved yet
            </Text>
            <Text className="w-3/4 text-center font-visby text-gray-400 mb-6">
              Create your first AI-powered recipe from any video or photo!
            </Text>
            <TouchableOpacity 
                onPress={() => router.push('/(tabs)/generate')}
                className="bg-red-500 px-6 py-3 rounded-full flex-row items-center shadow-lg shadow-red-200"
            >
                <Ionicons name="add-circle" size={20} color="white" style={{marginRight: 8}} />
                <Text className="font-visby-bold text-white">Create My First Recipe</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recipes.map((recipe) => (
            <TouchableOpacity
              key={recipe.id}
              onPress={() => setSelectedRecipe(recipe)}
              className="mb-4 flex-row items-center rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <View className="mr-4 h-16 w-16 items-center justify-center rounded-xl bg-orange-100">
                <Text className="text-3xl">🍲</Text>
              </View>
              <View className="flex-1">
                <Text numberOfLines={1} className="mb-1 font-visby-bold text-lg text-gray-900">
                  {recipe.title}
                </Text>
                <Text numberOfLines={2} className="mb-2 font-visby text-xs text-gray-500">
                  {recipe.description}
                </Text>
                <View className="flex-row items-center space-x-3">
                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={12} color="gray" />
                    <Text className="ml-1 text-xs text-gray-500">{recipe.time_minutes}m</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="flame-outline" size={12} color="gray" />
                    <Text className="ml-1 text-xs text-gray-500">
                      {recipe.calories_per_serving} kcal
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ddd" />
            </TouchableOpacity>
          ))
        )}
        <View className="h-24" />
      </ScrollView>

      {renderDetailModal()}
    </SafeAreaView>
  );
}
