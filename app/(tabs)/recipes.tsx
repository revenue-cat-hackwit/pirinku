import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Share,
  ActivityIndicator,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  Keyboard,
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

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

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

  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Menu state
  const [showMenu, setShowMenu] = useState(false);

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

  const toggleSearch = () => {
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (showMenu) setShowMenu(false); // Close menu if open

    if (showSearch) {
      Keyboard.dismiss();
      setSearchQuery('');
    }
    setShowSearch(!showSearch);
  };

  const toggleMenu = () => {
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (showSearch) {
      setShowSearch(false);
      Keyboard.dismiss();
      setSearchQuery('');
    }
    setShowMenu(!showMenu);
  };

  // Filter recipes based on search query
  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return savedRecipes;
    const query = searchQuery.toLowerCase();
    return savedRecipes.filter(
      (recipe) =>
        recipe.title.toLowerCase().includes(query) ||
        (recipe.description && recipe.description.toLowerCase().includes(query)) ||
        (recipe.ingredients && recipe.ingredients.some((ing) => ing.toLowerCase().includes(query))),
    );
  }, [savedRecipes, searchQuery]);

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

    if (searchQuery) {
      return (
        <View className="mt-20 items-center justify-center opacity-70">
          <Ionicons name="search-outline" size={80} color="#ccc" />
          <Text className="mt-4 font-visby-bold text-lg text-gray-500 dark:text-gray-400">
            No recipes found
          </Text>
          <Text className="w-3/4 text-center text-gray-400">
            Try finding a different recipe or checking your spelling.
          </Text>
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
        <Text className="flex-1 font-visby-bold text-3xl text-gray-900 dark:text-white">
          Recipe Collection 📚
        </Text>
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={toggleSearch}
            className={`rounded-full border p-2 shadow-sm ${showSearch ? 'border-red-500 bg-red-500' : 'border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900'}`}
          >
            <Ionicons
              name={showSearch ? 'close' : 'search'}
              size={20}
              color={showSearch ? 'white' : '#CC5544'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleMenu}
            className={`rounded-full border p-2 shadow-sm ${showMenu ? 'border-black bg-black dark:border-white dark:bg-white' : 'border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900'}`}
          >
            <Ionicons
              name={showMenu ? 'close' : 'grid-outline'}
              size={20}
              color={showMenu ? (isDark ? 'black' : 'white') : '#CC5544'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* QUICK ACTIONS MENU */}
      {showMenu && (
        <View className="mb-4 flex-row justify-around px-5 pb-2 pt-1">
          <TouchableOpacity onPress={() => router.push('/meal-planner')} className="items-center">
            <View className="mb-1 h-12 w-12 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-900/20">
              <Ionicons name="calendar-outline" size={24} color="#F97316" />
            </View>
            <Text className="font-visby-bold text-xs text-gray-700 dark:text-gray-300">
              Planner
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/pantry')} className="items-center">
            <View className="mb-1 h-12 w-12 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20">
              <Ionicons name="basket-outline" size={24} color="#22C55E" />
            </View>
            <Text className="font-visby-bold text-xs text-gray-700 dark:text-gray-300">Pantry</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/shopping-list')} className="items-center">
            <View className="mb-1 h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
              <Ionicons name="cart-outline" size={24} color="#3B82F6" />
            </View>
            <Text className="font-visby-bold text-xs text-gray-700 dark:text-gray-300">
              Shop List
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* SEARCH BAR */}
      {showSearch && (
        <View className="px-5 pb-4">
          <View className="h-12 flex-row items-center rounded-xl border border-gray-100 bg-white px-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search recipes, ingredients..."
              placeholderTextColor="#9CA3AF"
              className="h-full flex-1 font-visby text-base text-gray-900 dark:text-white"
              autoFocus
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <FlatList
        data={filteredRecipes}
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
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}
