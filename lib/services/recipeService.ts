import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import { Recipe } from '@/lib/types';

export const RecipeService = {
  /**
   * Upload video file significantly cleaner
   */
  /**
   * Upload media file (Video or Image)
   */
  async uploadMedia(uri: string): Promise<string> {
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const isVideo = ['mp4', 'mov', 'avi'].includes(ext);
    const contentType = isVideo ? `video/${ext}` : `image/${ext}`;

    // Clean filename
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const bucket = 'videos'; // Re-using videos bucket for now, or change to 'media' if available

    try {
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      const { error } = await supabase.storage.from(bucket).upload(fileName, arrayBuffer, {
        contentType: contentType,
        upsert: false,
      });

      if (error) throw error;

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      console.error('RecipeService Upload Error:', error);
      throw error;
    }
  },

  /**
   * Generate food image from text prompt
   */
  async generateImage(prompt: string): Promise<string> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');

    const { data, error } = await supabase.functions.invoke('generate-food-image', {
      body: { prompt },
    });

    if (error) {
      console.error('Generate Image Error:', error);
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to generate image');
    }

    return data.imageUrl;
  },

  /**
   * Step 1: Extract Media from URL (Social Media support)
   */
  async extractMedia(videoUrl: string): Promise<{ mediaItems: any[]; sourceUrl?: string }> {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/extract-media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ videoUrl }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Media Extraction Failed: ${errorText}`); // Shortened error
      }

      const data = await response.json();
      if (data.success && data.data) {
        return data.data; // Returns { mediaItems: [], sourceUrl: ... }
      } else {
        throw new Error('Invalid media extraction response.');
      }
    } catch (error) {
      console.error('Extract Media Error:', error);
      throw error;
    }
  },

  /**
   * Step 2: Generate recipe from Processed Media Items
   * Now accepts an object with mediaItems or the old videoUrl for backward compat
   */
  async generateFromVideo(
    input: { videoUrl?: string; mediaItems?: any[] },
    userPreferences?: any,
  ): Promise<Recipe> {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-recipe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          ...input, // spreads mediaItems or videoUrl
          userPreferences: userPreferences,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Recipe Gen Failed: ${errorText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        return {
          ...data.data,
          // Handle sourceUrl if backend doesn't return it
          sourceUrl: input.videoUrl || data.data.sourceUrl,
          // ID and CreatedAt provided by client usually, or we can add here
        } as Recipe;
      } else {
        throw new Error('Invalid recipe data returned.');
      }
    } catch (error) {
      console.error('RecipeService Gen Error:', error);
      throw error;
    }
  },

  /**
   * Save recipe to Supabase (Cloud Sync)
   */
  async saveRecipe(recipe: Recipe): Promise<Recipe> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_recipes')
      .insert({
        user_id: userData.user.id,
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        time_minutes: recipe.time_minutes,
        difficulty: recipe.difficulty,
        servings: recipe.servings,
        calories_per_serving: recipe.calories_per_serving,
        tips: recipe.tips,
        source_url: recipe.sourceUrl,
        image_url: recipe.imageUrl, // Capture image for feed
      })
      .select()
      .single();

    if (error) {
      console.error('Save Recipe Error:', error);
      throw error;
    }

    return {
      ...recipe,
      id: data.id,
      createdAt: data.created_at,
    };
  },

  /**
   * Update existing recipe
   */
  async updateRecipe(recipe: Recipe): Promise<void> {
    const { error } = await supabase
      .from('user_recipes')
      .update({
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        tips: recipe.tips,
        image_url: recipe.imageUrl,
      })
      .eq('id', recipe.id);

    if (error) {
      console.error('Update Recipe Error:', error);
      throw error;
    }
  },
  async getUserRecipes(): Promise<Recipe[]> {
    const { data, error } = await supabase
      .from('user_recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      ingredients: row.ingredients,
      steps: row.steps,
      time_minutes: row.time_minutes,
      difficulty: row.difficulty,
      servings: row.servings,
      calories_per_serving: row.calories_per_serving,
      tips: row.tips,
      sourceUrl: row.source_url,
      imageUrl: row.image_url,
      createdAt: row.created_at,
    }));
  },

  /**
   * Delete recipe
   */
  async deleteRecipe(id: string): Promise<void> {
    const { error } = await supabase.from('user_recipes').delete().eq('id', id);
    if (error) throw error;
  },
};
