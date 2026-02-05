import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Animated } from 'react-native';
import { TickCircle } from 'iconsax-react-native';

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
  const [imageLoaded, setImageLoaded] = useState(false);
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleValue }],
        width: '47%',
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        className={`overflow-hidden rounded-2xl border-2 ${
          isSelected ? 'border-[#8BD65E] bg-green-50' : 'border-gray-200 bg-white'
        }`}
        style={{
          shadowColor: isSelected ? '#8BD65E' : '#000',
          shadowOffset: { width: 0, height: isSelected ? 4 : 2 },
          shadowOpacity: isSelected ? 0.25 : 0.1,
          shadowRadius: isSelected ? 8 : 4,
          elevation: isSelected ? 6 : 3,
        }}
      >
      {/* Image Container */}
      <View className="h-32 w-full items-center justify-center p-3">
        {imagePath ? (
          <View className="relative h-full w-full">
            {/* Loading Placeholder */}
            {!imageLoaded && (
              <View className="absolute inset-0 items-center justify-center rounded-xl bg-gray-200">
                <View className="h-16 w-16 rounded-full bg-gray-300" />
              </View>
            )}

            {/* Actual Image */}
            <Image
              source={{ uri: imagePath, cache: 'force-cache' }}
              className="h-full w-full rounded-xl"
              resizeMode="cover"
              onLoadStart={() => setImageLoaded(false)}
              onLoadEnd={() => setImageLoaded(true)}
            />
          </View>
        ) : (
          <View className="h-full w-full items-center justify-center">
            <View className="h-20 w-20 rounded-full border-2 border-gray-200 bg-gray-200" />
          </View>
        )}
      </View>

      {/* Label */}
      <View className="items-center px-3 pb-4 pt-2">
        <Text 
          className="text-center font-visby-bold text-sm text-gray-900"
          numberOfLines={2}
        >
          {label}
        </Text>
      </View>

      {/* Selection Indicator */}
      {isSelected && (
        <View className="absolute right-3 top-3 rounded-full bg-[#8BD65E] p-1.5">
          <TickCircle size={16} color="#FFFFFF" variant="Bold" />
        </View>
      )}
    </TouchableOpacity>
    </Animated.View>
  );
}
