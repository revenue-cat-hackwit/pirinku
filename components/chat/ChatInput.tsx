import React from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onPickImage: () => void;
  loading: boolean;
  disabled?: boolean;
}

export const ChatInput = ({
  value,
  onChangeText,
  onSend,
  onPickImage,
  loading,
  disabled,
}: ChatInputProps) => {
  const router = useRouter();

  return (
    <View className="bg-transparent p-4">
      {/* Container Kotak Hitam Besar */}
      <View className="min-h-[120px] justify-between rounded-[32px] bg-[#1E1F20] p-4">
        {/* Input Area (Atas) */}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Tanya Pirinku..."
          placeholderTextColor="#9ca3af"
          className="mb-2 max-h-[120px] font-visby text-lg text-white"
          multiline
          textAlignVertical="top"
        />

        {/* Action Row (Bawah) */}
        <View className="mt-2 flex-row items-center justify-between">
          {/* Kiri: Add Image */}
          <View className="flex-row items-center gap-4">
            <TouchableOpacity onPress={onPickImage} disabled={disabled || loading}>
              <View className="h-10 w-10 items-center justify-center rounded-full bg-[#2A2B2C]">
                <Ionicons name="add" size={24} color="#E3E3E3" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Kanan: Tombol Dinamis */}
          <View className="flex-row items-center gap-3">
            {loading ? (
              /* 1. LOADING STATE: Stop Button (Square) */
              <TouchableOpacity onPress={() => console.log('Stop Generating')} className="mr-1">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-[#2A2B2C]">
                  <Ionicons name="square" size={14} color="#E3E3E3" />
                </View>
              </TouchableOpacity>
            ) : value.trim().length > 0 ? (
              /* 2. TYPING STATE: Send Button (Red Arrow) */
              <TouchableOpacity onPress={onSend} disabled={disabled}>
                <View className="h-10 w-10 items-center justify-center rounded-full bg-[#CC5544]">
                  <Ionicons name="arrow-up" size={24} color="white" />
                </View>
              </TouchableOpacity>
            ) : (
              /* 3. IDLE STATE: Mic + Voice Mode (Waveform) */
              <>
                <TouchableOpacity onPress={() => console.log('Mic Dikte')}>
                  <Ionicons name="mic" size={24} color="#E3E3E3" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push('/voice-mode')}>
                  <View className="h-10 w-10 items-center justify-center rounded-full border border-gray-700 bg-black">
                    <Ionicons name="pulse" size={24} color="white" />
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};
