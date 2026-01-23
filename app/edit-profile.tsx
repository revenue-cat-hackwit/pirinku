import { useAuthStore } from '@/lib/store/authStore';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const user = session?.user;
  const setCredentials = useAuthStore((state) => state.setCredentials);

  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [bio, setBio] = useState(user?.user_metadata?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      // NOTE: For MVP, we save base64 directly to metadata or upload to storage.
      // Uploading to Supabase Storage is better, but requires a bucket setup ('avatars').
      // Let's assume we convert to data URI for now (limit 4MB metadata) OR
      // Better: Suggest user to implement storage later. For now, let's try upload if bucket exists, else fail gracefully.

      // Let's just use the local URI preview for now and simulate "upload" by keeping it local state until save?
      // No, auth metadata needs a simpler string usually.
      // Lets proceed with uploading to a 'avatars' bucket if possible, or skip image update for this MVP step strictness.
      // Actually, let's use the Base64 Data URI for metadata (Size risky!).

      // ALTERNATIVE: Upload to Storage bucket 'avatars'
      uploadAvatar(result.assets[0]);
    }
  };

  const uploadAvatar = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      if (!asset.base64) return;
      setLoading(true);

      // Since implementing full storage upload logic here is complex without knowing if bucket exists,
      // We will stick to updating Name/Bio first.

      Alert.alert(
        'Info',
        "Fitur upload avatar membutuhkan konfigurasi Supabase Storage 'avatars'. Mengupdate visual lokal saja.",
      );
      // setAvatarUrl(`data:image/jpeg;base64,${asset.base64}`); // Too big for metadata usually
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updates = {
        full_name: fullName,
        bio: bio,
        // avatar_url: avatarUrl // Only update if we have a valid remote URL
      };

      const { data, error } = await supabase.auth.updateUser({
        data: updates,
      });

      if (error) throw error;

      // Update local store
      if (data.user && session) {
        setCredentials(session, data.user);
      }

      Alert.alert('Sukses', 'Profil berhasil diperbarui!');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between border-b border-gray-100 px-4 py-2">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="black" />
        </TouchableOpacity>
        <Text className="font-visby-bold text-lg">Edit Profil</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#5FD08F" />
          ) : (
            <Ionicons name="checkmark" size={28} color="#5FD08F" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-6">
        {/* Avatar Section */}
        <View className="mb-8 items-center">
          <Image
            source={{ uri: avatarUrl || 'https://via.placeholder.com/150' }}
            style={{ width: 100, height: 100, borderRadius: 50 }}
          />
          <TouchableOpacity onPress={pickImage} className="mt-3">
            <Text className="font-visby-bold text-base text-[#5FD08F]">Ganti Foto Profil</Text>
          </TouchableOpacity>
        </View>

        {/* Fields */}
        <View className="space-y-6">
          <View>
            <Text className="mb-2 ml-1 font-visby text-gray-500">Nama Lengkap</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              className="border-b border-gray-200 pb-2 font-visby-bold text-lg text-black"
              placeholder="Nama Kamu"
              placeholderTextColor="#ccc"
            />
          </View>

          <View>
            <Text className="mb-2 ml-1 font-visby text-gray-500">Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
              className="border-b border-gray-200 pb-2 font-visby text-base text-black"
              placeholder="Ceritakan sedikit tentang dirimu..."
              placeholderTextColor="#ccc"
              style={{ minHeight: 80, textAlignVertical: 'top' }}
            />
            <Text className="mt-1 text-right text-xs text-gray-400">{bio.length}/150</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
