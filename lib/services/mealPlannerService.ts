import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import { Recipe } from '@/lib/types';
import { TokenStorage } from './apiClient';

export interface MealPlan {
  id: string;
  user_id: string;
  recipe_id: string;
  date: string; // YYYY-MM-DD
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  recipe: Recipe;
}

export const MealPlannerService = {
  /**
   * Get meal plans for a specific date range
   */
  async getMealPlans(startDate: string, endDate: string): Promise<MealPlan[]> {
    const { data, error } = await supabase
      .from('meal_plans')
      .select(
        `
        *,
        recipe:user_recipes (
          id,
          title,
          ingredients,
          steps,
          image_url,
          time_minutes,
          calories_per_serving,
          description,
          difficulty,
          servings,
          tips,
          source_url,
          collections
        )
      `,
      )
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;

    // Map Join Result to Type
    return data.map((item: any) => {
      const rawRecipe = item.recipe || {};
      const mappedRecipe: Recipe = {
        id: rawRecipe.id,
        title: rawRecipe.title || 'Unknown Recipe',
        ingredients: rawRecipe.ingredients || [],
        steps: rawRecipe.steps || [],
        imageUrl: rawRecipe.image_url, // Map to Type
        time_minutes: rawRecipe.time_minutes,
        calories_per_serving: rawRecipe.calories_per_serving,
        description: rawRecipe.description,
        difficulty: rawRecipe.difficulty,
        servings: rawRecipe.servings,
        tips: rawRecipe.tips,
        sourceUrl: rawRecipe.source_url,
        collections: rawRecipe.collections || [],
      };

      return {
        ...item,
        recipe: mappedRecipe,
      };
    });
  },

  /**
   * Add a recipe to meal plan
   */
  async addMealPlan(recipeId: string, date: string, mealType: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { error } = await supabase.from('meal_plans').insert({
      user_id: userData.user.id,
      recipe_id: recipeId,
      date: date,
      meal_type: mealType,
    });

    if (error) {
      // Handle constraint violation (already exists)
      if (error.code === '23505') {
        throw new Error('You already have this meal planned for this slot.');
      }
      throw error;
    }
  },

  /**
   * Remove a meal plan
   */
  async deleteMealPlan(id: string): Promise<void> {
    const { error } = await supabase.from('meal_plans').delete().eq('id', id);
    if (error) throw error;
  },

  /**
   * Auto-Generate Weekly Plan via AI
   */
  async generateWeeklyPlan(
    startDate: string,
    preferences?: { goal?: string; dietType?: string; allergies?: string; calories?: string },
    generationMode?: 'replace' | 'fill',
  ): Promise<void> {
    console.log('[MealPlanner] 🔍 Checking authentication...');
    
    // Try to get Supabase session first
    const { data: sessionData } = await supabase.auth.getSession();
    let token = sessionData.session?.access_token;
    let userId = sessionData.session?.user?.id;
    
    if (!token) {
      console.log('[MealPlanner] ⚠️ No Supabase session, using custom JWT as fallback...');
      
      // Fallback to custom JWT
      const customToken = await TokenStorage.getToken();
      if (!customToken) {
        throw new Error('Not authenticated. Please sign in again.');
      }
      
      // Decode custom JWT to get user ID
      try {
        const base64Url = customToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        userId = decoded.userId;
        token = customToken;
        
        console.log('[MealPlanner] ✅ Using custom JWT for user:', userId);
      } catch (error) {
        console.error('[MealPlanner] ❌ Failed to decode custom JWT:', error);
        throw new Error('Invalid authentication token');
      }
    } else {
      console.log('[MealPlanner] ✅ Using Supabase session for user:', userId);
    }

    if (!token || !userId) {
      throw new Error('Not authenticated. Please sign in again.');
    }

    console.log('[MealPlanner] Generating plan for:', startDate);

    // Use direct fetch for better reliability/debugging
    const baseUrl = supabaseUrl.replace(/\/$/, '');
    const functionUrl = `${baseUrl}/functions/v1/generate-weekly-plan`;

    console.log('[MealPlanner] Fetching:', functionUrl);
    console.log('[MealPlanner] Token type:', token.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9') ? 'Custom JWT' : 'Supabase JWT');

    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: supabaseAnonKey,
          'x-user-id': userId, // Pass user ID explicitly for custom JWT
        },
        body: JSON.stringify({
          startDate,
          customPreferences: preferences,
          generationMode: generationMode || 'replace',
          userId, // Also include in body
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('[MealPlanner] ❌ Response error:', {
          status: response.status,
          statusText: response.statusText,
          body: text.substring(0, 500),
        });
        let errMsg = text;
        try {
          const json = JSON.parse(text);
          errMsg = json.message || json.error || text;
        } catch {}
        throw new Error(`Server Error: ${errMsg}`);
      }

      const data = await response.json();
      console.log('[MealPlanner] ✅ Success:', data);
      if (!data.success) throw new Error(data.error || 'Failed to generate plan');
    } catch (error: any) {
      console.error('[MealPlanner] ❌ Exception:', error);
      // Handle network errors specifically
      if (
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('Network request failed') ||
        error.message?.includes('timeout')
      ) {
        throw new Error('No internet connection. Please check your network and try again.');
      }
      // Re-throw other errors
      throw error;
    }
  },
};
