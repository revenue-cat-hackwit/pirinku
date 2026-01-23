import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

export default function VoiceModeScreen() {
  const router = useRouter();

  // Animation Value for Pulse Effect
  const imageScale = useSharedValue(1);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    // Breathing animation loop
    imageScale.value = withRepeat(
      withTiming(1.1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    opacity.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: imageScale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="black" />
        </TouchableOpacity>
        <Text className="font-visby-bold text-xl text-black">Pirinku</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Main Content */}
      <View className="-mt-20 flex-1 items-center justify-center">
        <Text className="mb-12 px-10 text-center font-visby text-lg text-gray-600">
          Ngomong apa aja yang kamu punya
        </Text>

        {/* Animated Orb */}
        <Animated.View
          style={[
            animatedStyle,
            { width: 300, height: 300, justifyContent: 'center', alignItems: 'center' },
          ]}
        >
          {/* Using a nice gradient orb image */}
          <Image
            source={{
              uri: 'https://cdn.dribbble.com/users/124059/screenshots/15479427/media/5e478589f635c9a09320875c7553757d.jpg?resize=800x600&vertical=center',
            }} // Placeholder stylish orb
            style={{ width: 280, height: 280, borderRadius: 140 }}
            contentFit="cover"
          />
          {/* Overlay to mask the square image into a soft orb look if needed, or just use borderRadius */}
          {/* Better Image URL for Orb: */}
        </Animated.View>
      </View>

      {/* Footer Controls */}
      <View className="flex-row items-center justify-between px-10 pb-12">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-14 w-14 items-center justify-center rounded-full bg-[#5FD08F]"
        >
          <Ionicons name="keypad" size={24} color="white" />
        </TouchableOpacity>

        {/* Big Mic Button with Pulse Ring */}
        <View className="items-center justify-center">
          <View className="absolute h-24 w-24 scale-125 items-center justify-center rounded-full bg-[#E8F8F0] opacity-50" />
          <TouchableOpacity
            activeOpacity={0.7}
            className="h-20 w-20 items-center justify-center rounded-full bg-[#5FD08F] shadow-lg shadow-green-200"
          >
            <Ionicons name="mic" size={40} color="white" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity className="h-14 w-14 items-center justify-center rounded-full bg-[#5FD08F]">
          <Ionicons name="menu" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
