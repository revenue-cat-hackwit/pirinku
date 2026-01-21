import AuthBackButton from '@/components/auth/AuthBackButton';
import AuthHeader from '@/components/auth/AuthHeader';
import AuthPasswordField from '@/components/auth/AuthPasswordField';
import AuthPrimaryButton from '@/components/auth/AuthPrimaryButton';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResetPasswordPage() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-4">
        <AuthBackButton onPress={() => router.back()} />

        <View className="gap-6">
          <AuthHeader
            title="Reset Password"
            subtitle="Create your new Password, Password must be different from any password you have used before."
            titleClassName="font-visby text-2xl font-semibold text-black"
            subtitleClassName="font-visby text-sm text-gray-500"
          />

          <View className="gap-4">
            <AuthPasswordField
              label="New Password"
              placeholder="••••••••"
              labelClassName="font-visby text-sm font-medium text-black"
              inputWrapperClassName="flex-row items-center justify-between rounded-xl border border-green-400 px-4 py-3"
              inputClassName="font-visby flex-1 text-sm text-black"
            />
            <AuthPasswordField
              label="Confirm Password"
              placeholder="••••••••"
              labelClassName="font-visby text-sm font-medium text-black"
              inputWrapperClassName="flex-row items-center justify-between rounded-xl border border-green-400 px-4 py-3"
              inputClassName="font-visby flex-1 text-sm text-black"
            />
          </View>

          <AuthPrimaryButton title="Reset Password" />
        </View>
      </View>
    </SafeAreaView>
  );
}
