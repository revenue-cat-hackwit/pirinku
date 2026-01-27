import AuthOutlineButton from '@/components/auth/AuthOutlineButton';
import AuthPrimaryButton from '@/components/auth/AuthPrimaryButton';
import OnBoardingCarousel from '@/components/OnBoardingCarousel';
import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnBoardingPage() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-between px-6">
        {/* Onboarding Carousel */}
        <OnBoardingCarousel />

        {/* Action buttons */}
        <View className="mt-8 gap-3 pb-6">
          <AuthPrimaryButton title="Sign in" onPress={() => router.push('/sign-in')} />
          <AuthOutlineButton title="Sign Up" onPress={() => router.push('/sign-up')} />
        </View>
      </View>
    </SafeAreaView>
  );
}
