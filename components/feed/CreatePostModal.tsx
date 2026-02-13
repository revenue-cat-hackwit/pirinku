import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
  ScrollView,
  // Alert, // Removed native Alert import
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { Camera, Gallery, CloseCircle } from 'iconsax-react-native';
import * as ImagePicker from 'expo-image-picker';
import { UploadService } from '@/lib/services/uploadService';


import { CustomCameraModal } from '@/components/CustomCameraModal';
import { RecipeSelectModal } from './RecipeSelectModal';
import { Book } from 'iconsax-react-native';
import { Recipe } from '@/lib/types';
import { CustomAlertModal } from '@/components/CustomAlertModal';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (content: string, imageUrl?: string) => Promise<void>;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isCameraVisible, setIsCameraVisible] = useState(false); 
  const [isRecipeModalVisible, setIsRecipeModalVisible] = useState(false);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'default' as 'default' | 'destructive',
    icon: 'alert-circle',
    showCancel: false,
    confirmText: 'OK',
    cancelText: 'Cancel',
    onConfirm: () => {},
  });

  const showAlert = (title: string, message: string, variant: 'success' | 'warning' | 'error' | 'info' = 'error') => {
    let type: 'default' | 'destructive' = 'default';
    let icon = 'alert-circle';
    
    switch (variant) {
        case 'error':
            type = 'destructive';
            icon = 'alert-circle';
            break;
        case 'warning':
            type = 'default';
            icon = 'warning-outline';
            break;
        case 'success':
            type = 'default';
            icon = 'checkmark-circle';
            break;
        case 'info':
        default:
            type = 'default';
            icon = 'information-circle';
            break;
    }

    setAlertConfig(prev => ({
        ...prev,
        visible: true,
        title,
        message,
        type,
        icon,
        onConfirm: () => setAlertConfig(p => ({ ...p, visible: false })),
    }));
  };

  const handleSubmit = async () => {
    const hasContent = content.trim().length > 0;
    const hasRecipe = !!selectedRecipe;

    if ((!hasContent && !hasRecipe) || isSubmitting) {
      showAlert('Oops!', 'Please write something or attach a recipe!', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalContent = content.trim();
      if (selectedRecipe) {
          // Use clear delimiters to avoid JSON syntax corruption
          const recipeJson = JSON.stringify(selectedRecipe);
          finalContent += `\n\n[recipe-json-start]${recipeJson}[recipe-json-end]`;
      }

      await onSubmit(finalContent, imageUrl.trim() || undefined);
      setContent('');
      setSelectedRecipe(null);
      setImageUrl('');
      setSelectedImage(null);
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      showAlert('Error', 'Failed to create post. Please try again!', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !isUploading) {
      setContent('');
      setImageUrl('');
      setSelectedImage(null);
      setSelectedRecipe(null);
      onClose();
    }
  };

  const handleCameraCapture = async (uri: string) => {
    setIsCameraVisible(false);
    setSelectedImage(uri);
    await uploadImage({ uri });
  };

  const pickImage = async (sourceType: 'camera' | 'gallery') => {
    try {
      if (sourceType === 'camera') {
        // Use Custom Camera
        setIsCameraVisible(true);
        return;
      }
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
          showAlert('Permission Required', 'We need permission to access your photo library.', 'warning');
          return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        await uploadImage(asset);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showAlert('Error', 'Failed to select image. Please try again!', 'error');
    }
  };

  // ... rest of the component ... 

  // Inside return, add CustomCameraModal
  // Inside return, add CustomCameraModal
  const handleRecipeSelect = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsRecipeModalVisible(false);
  };


  const uploadImage = async (asset: { uri: string; fileName?: string | null; mimeType?: string | null }) => {
    setIsUploading(true);
    try {
      const fileName = asset.fileName || `photo_${Date.now()}.jpg`;
      const fileType = asset.mimeType || 'image/jpeg';

      const file = {
        uri: asset.uri,
        name: fileName,
        type: fileType,
      };

      const response = await UploadService.uploadFile(file);
      
      if (response.success && response.data.url) {
        setImageUrl(response.data.url);
        showAlert('Success!', 'Photo uploaded successfully!', 'success');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showAlert('Error', 'Failed to upload image. Please try again!', 'error');
      setSelectedImage(null);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setImageUrl('');
    setSelectedImage(null);
  };



  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-white dark:bg-[#0F0F0F]" style={{ paddingTop: insets.top }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <TouchableOpacity onPress={handleClose} disabled={isSubmitting || isUploading}>
              <Ionicons name="close" size={28} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
            <Text className="font-visby-bold text-lg text-gray-900 dark:text-white">
              Create New Post
            </Text>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={(!content.trim() && !selectedRecipe) || isSubmitting || isUploading}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#8BC34A" />
              ) : (
                <Text
                  className={`font-visby-bold text-base ${
                    (content.trim() || selectedRecipe) && !isUploading ? 'text-[#8BC34A]' : 'text-gray-400'
                  }`}
                >
                  Post
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">
            {/* Content Input */}
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="What's cooking today? Share your culinary story..."
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              multiline
              numberOfLines={6}
              maxLength={1000}
              className="min-h-[150px] rounded-2xl bg-gray-50 p-4 font-visby text-base text-gray-900 dark:bg-gray-800 dark:text-white"
              style={{ textAlignVertical: 'top' }}
              editable={!isSubmitting && !isUploading}
              autoFocus
            />
            <Text className="mt-2 text-right font-visby text-xs text-gray-400">
              {content.length}/1000
            </Text>

            {/* Selected Recipe Card */}
            {selectedRecipe && (
              <View className="mt-4 flex-row items-center justify-between rounded-xl bg-orange-50 p-4 border border-orange-100 dark:bg-orange-900/20 dark:border-orange-800">
                <View className="flex-row items-center flex-1">
                   <View className="h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-800 mr-3">
                      <Book size={20} color="#F97316" variant="Bold" />
                   </View>
                   <View className="flex-1">
                      <Text className="font-visby text-xs text-orange-600 dark:text-orange-400">Attached Recipe</Text>
                      <Text className="font-visby-bold text-sm text-gray-900 dark:text-white" numberOfLines={1}>
                          {selectedRecipe.title}
                      </Text>
                   </View>
                </View>
                <TouchableOpacity onPress={() => setSelectedRecipe(null)} className="p-1">
                    <Ionicons name="close" size={20} color="#F97316" />
                </TouchableOpacity>
              </View>
            )}

            {/* Image Preview */}
            {(selectedImage || imageUrl) && (
              <View className="relative mt-4 overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800">
                {isUploading ? (
                  <View className="h-[200px] items-center justify-center">
                    <ActivityIndicator size="large" color="#8BC34A" />
                    <Text className="mt-2 font-visby text-sm text-gray-600 dark:text-gray-400">
                      Uploading photo...
                    </Text>
                  </View>
                ) : (
                  <>
                    <Image
                      source={{ uri: selectedImage || imageUrl }}
                      style={{ width: '100%', height: 200 }}
                      contentFit="cover"
                    />
                    <TouchableOpacity
                      onPress={removeImage}
                      className="absolute right-2 top-2 h-10 w-10 items-center justify-center rounded-full bg-black/60"
                    >
                      <CloseCircle size={28} color="white" variant="Bold" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {/* Add Image Options */}
            {!selectedImage && !imageUrl && !isUploading && (
              <View className="mt-6">
                <Text className="mb-3 font-visby-bold text-sm text-gray-500 dark:text-gray-400">
                  Add Content
                </Text>
                
                {/* Row 1: Camera & Gallery */}
                <View className="mb-3 flex-row items-center">
                  <View className="flex-1">
                    <TouchableOpacity
                      onPress={() => pickImage('camera')}
                      className="items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 py-6 dark:border-gray-700 dark:bg-gray-800"
                      disabled={isSubmitting}
                    >
                      <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                        <Camera size={24} color="#3B82F6" variant="Bold" />
                      </View>
                      <Text className="font-visby-bold text-sm text-gray-700 dark:text-gray-300">
                        Camera
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text className="px-3 font-visby-bold text-sm text-gray-400 dark:text-gray-500">
                    or
                  </Text>

                  <View className="flex-1">
                    <TouchableOpacity
                      onPress={() => pickImage('gallery')}
                      className="items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 py-6 dark:border-gray-700 dark:bg-gray-800"
                      disabled={isSubmitting}
                    >
                      <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                        <Gallery size={24} color="#A78BFA" variant="Bold" />
                      </View>
                      <Text className="font-visby-bold text-sm text-gray-700 dark:text-gray-300">
                        Gallery
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Row 2: Recipe */}
                <TouchableOpacity
                  onPress={() => setIsRecipeModalVisible(true)}
                  className="items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 py-6 dark:border-gray-700 dark:bg-gray-800"
                  disabled={isSubmitting}
                >
                  <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                    <Book size={24} color="#F97316" variant="Bold" />
                  </View>
                  <Text className="font-visby-bold text-sm text-gray-700 dark:text-gray-300">
                    Attach Recipe
                  </Text>
                </TouchableOpacity>
              </View>
            )}


          </ScrollView>


        </KeyboardAvoidingView>
      </View>
      <CustomCameraModal
        visible={isCameraVisible}
        onClose={() => setIsCameraVisible(false)}
        onPhotoTaken={handleCameraCapture}
      />
      
      <RecipeSelectModal
        visible={isRecipeModalVisible}
        onClose={() => setIsRecipeModalVisible(false)}
        onSelect={handleRecipeSelect}
      />
      
      <CustomAlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        icon={alertConfig.icon}
        showCancel={alertConfig.showCancel}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        onConfirm={alertConfig.onConfirm}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </Modal>
  );
};
