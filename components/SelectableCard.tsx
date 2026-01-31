import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';

interface SelectableCardProps {
  label: string;
  imagePath?: string;
  isSelected: boolean;
  onPress: () => void;
  showBorder?: boolean;
}

export default function SelectableCard({
  label,
  imagePath,
  isSelected,
  onPress,
  showBorder = false,
}: SelectableCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`w-[47%] overflow-hidden rounded-2xl border-2 bg-white ${
        isSelected ? 'border-[#8BD65E]' : 'border-gray-200'
      }`}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      {/* Image Container - User will connect images later */}
      <View className="h-32 w-full items-center justify-center p-3">
        {imagePath ? (
          <Image
            source={{ uri: imagePath }}
            className="h-full w-full rounded-xl border-2 border-gray-200"
            resizeMode="cover"
          />
        ) : (
          <View className="h-full w-full items-center justify-center">
            {/* Placeholder - will be replaced with actual images */}
            <View className="h-20 w-20 rounded-full border-2 border-gray-200 bg-gray-200" />
          </View>
        )}
      </View>

      {/* Label */}
      <View className="items-center p-3">
        <Text className="text-center font-visby-bold text-sm text-gray-900">{label}</Text>
      </View>

      {/* Selection Indicator */}
      {isSelected && (
        <View className="absolute right-2 top-2 h-6 w-6 items-center justify-center rounded-full bg-[#8BD65E]">
          <Text className="font-visby-bold text-xs text-white">✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
