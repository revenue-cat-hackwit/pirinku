import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  servingSize: string;
  foodName: string;
  confidence: number;
  healthScore: number;
  dietaryFlags: string[];
  warnings?: string[];
}

export interface NutritionAnalysisResult {
  success: boolean;
  nutrition?: NutritionInfo;
  error?: string;
  message?: string;
}

export const NutritionAnalyzerService = {
  /**
   * Analyze nutrition from a food image
   */
  async analyzeFromImage(imageUrl: string): Promise<NutritionInfo> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      throw new Error('No active session found');
    }

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/analyze-nutrition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Nutrition analysis API error:', errorText);
        throw new Error(`Analysis failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || data.message || 'Failed to analyze nutrition');
      }

      return data.nutrition;
    } catch (error: any) {
      console.error('Nutrition Analysis Error:', error);
      throw error;
    }
  },

  /**
   * Upload image and analyze nutrition
   */
  async uploadAndAnalyze(imageUri: string): Promise<NutritionInfo> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');

    // Upload image to Supabase Storage
    const fileName = `nutrition-${Date.now()}.jpg`;
    const filePath = `${userData.user.id}/${fileName}`;

    const response = await fetch(imageUri);
    const blob = await response.blob();

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('food-images')
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload image');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('food-images')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Analyze the uploaded image
    return this.analyzeFromImage(publicUrl);
  },

  /**
   * Get health recommendations based on nutrition
   */
  getHealthRecommendations(nutrition: NutritionInfo): string[] {
    const recommendations: string[] = [];

    if (nutrition.healthScore >= 80) {
      recommendations.push('✅ Great nutritional balance!');
    } else if (nutrition.healthScore >= 60) {
      recommendations.push('⚠️ Good nutrition, but could be improved');
    } else {
      recommendations.push('❌ Consider healthier alternatives');
    }

    if (nutrition.protein < 10) {
      recommendations.push('Consider adding protein sources');
    }

    if (nutrition.fiber < 3) {
      recommendations.push('Low in fiber - add vegetables or whole grains');
    }

    if (nutrition.sugar > 25) {
      recommendations.push('High in sugar - consume in moderation');
    }

    if (nutrition.sodium > 800) {
      recommendations.push('High in sodium - watch your salt intake');
    }

    if (nutrition.fat > 30) {
      recommendations.push('High in fat - balance with other meals');
    }

    return recommendations;
  },
};

export default NutritionAnalyzerService;
