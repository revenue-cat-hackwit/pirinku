import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Recipe } from '@/lib/types';
import { useRecipeStorage } from '@/lib/hooks/useRecipeStorage';
import { useRecipeGenerator } from '@/lib/hooks/useRecipeGenerator';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from 'nativewind';

// Import extracted components
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { RecipeDetailModal } from '@/components/recipes/RecipeDetailModal';

const RECIPES_STORAGE_KEY = 'pirinku_local_recipes_v1';

export default function SavedRecipesScreen() {
  const router = useRouter();
  const {
    savedRecipes,
    isLoading,
    isLoadingMore,
    hasMore,
    refreshRecipes,
    loadMore,
    deleteRecipe,
    saveRecipe,
    updateRecipe,
  } = useRecipeStorage();

  // Use generator hook for completing recipes
  const { completeRecipe } = useRecipeGenerator();

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  useFocusEffect(
    useCallback(() => {
      refreshRecipes();
    }, []),
  );

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await refreshRecipes();
    setRefreshing(false);
  };

  // --- Handlers passed to Modal/Components ---

  const handleUpdateRecipe = async (updatedRecipe: Recipe) => {
    await updateRecipe(updatedRecipe);
    setSelectedRecipe(updatedRecipe); // Update modal view if needed
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Success', 'Recipe updated successfully!');
  };

  const handleGenerateFull = async (recipe: Recipe) => {
    const result = await completeRecipe(recipe);
    if (result && result.success && result.data) {
      // Update the list view and modal view with the new data
      await updateRecipe(result.data);
      setSelectedRecipe(result.data);
      Alert.alert('Recipe Completed', 'Your recipe details are ready! 👨‍🍳');
    }
  };

  const handleDeleteRecipe = async (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Delete Recipe', 'Are you sure you want to delete this recipe?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteRecipe(id);
          if (selectedRecipe?.id === id) setSelectedRecipe(null); // Close modal
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleShareRecipe = async (recipe: Recipe) => {
    const ingredientsList = recipe.ingredients.map((i) => `• ${i}`).join('\n');
    const stepsList = recipe.steps.map((s) => `${s.step}. ${s.instruction}`).join('\n\n');

    const message =
      `🍳 *${recipe.title}*\n\n` +
      `⏱️ Time: ${recipe.time_minutes}m | 🔥 Calories: ${recipe.calories_per_serving}\n\n` +
      `🛒 *Ingredients:*\n${ingredientsList}\n\n` +
      `👨‍🍳 *Instructions:*\n${stepsList}\n\n` +
      `_Made with Pirinku App_ 📲`;

    try {
      await Share.share({
        message: message,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const renderFooter = () => {
    if (!isLoadingMore) return <View className="h-24" />;
    return (
      <View className="h-24 items-center justify-center p-4">
        <ActivityIndicator size="small" color="#CC5544" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View className="mt-20 items-center justify-center">
          <ActivityIndicator size="large" color="#CC5544" />
        </View>
      );
    }
    return (
      <View className="mt-20 items-center justify-center opacity-70">
        <Ionicons name="book-outline" size={80} color="#ccc" />
        <Text className="mt-4 font-visby-bold text-lg text-gray-500 dark:text-gray-400">
          No recipes saved yet
        </Text>
        <Text className="mb-6 w-3/4 text-center font-visby text-gray-400 dark:text-gray-500">
          Create your first AI-powered recipe from any video or photo!
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/generate')}
          className="flex-row items-center rounded-full bg-red-500 px-6 py-3 shadow-lg shadow-red-200 dark:shadow-none"
        >
          <Ionicons name="add-circle" size={20} color="white" style={{ marginRight: 8 }} />
          <Text className="font-visby-bold text-white">Create My First Recipe</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-[#0F0F0F]">
      <RecipeDetailModal
        recipe={selectedRecipe}
        visible={!!selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        onUpdate={handleUpdateRecipe}
        onDelete={handleDeleteRecipe}
        onShare={handleShareRecipe}
        onGenerateFull={handleGenerateFull}
      />

      <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
        <Text className="font-visby-bold text-3xl text-gray-900 dark:text-white">
          Recipe Collection 📚
        </Text>
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => router.push('/meal-planner')}
            className="rounded-full border border-gray-100 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <Ionicons name="calendar-outline" size={20} color="#CC5544" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/pantry')}
            className="rounded-full border border-gray-100 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <Ionicons name="basket-outline" size={20} color="#CC5544" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/shopping-list')}
            className="rounded-full border border-gray-100 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <Ionicons name="cart-outline" size={20} color="#CC5544" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={savedRecipes}
        keyExtractor={(item) => item.id || Math.random().toString()}
        renderItem={({ item }) => (
          <RecipeCard recipe={item} onPress={() => setSelectedRecipe(item)} />
        )}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
      />
    </SafeAreaView>
  );
}
