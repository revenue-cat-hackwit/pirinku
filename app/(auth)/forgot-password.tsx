import AuthBackButton from '@/components/auth/AuthBackButton';
import AuthHeader from '@/components/auth/AuthHeader';
import AuthPrimaryButton from '@/components/auth/AuthPrimaryButton';
import AuthTextField from '@/components/auth/AuthTextField';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isSent, setIsSent] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-4">
        <AuthBackButton onPress={() => router.back()} />

        {!isSent ? (
          <View className="gap-6">
            <AuthHeader
              title="Forgot Password"
              subtitle="Enter the email address associated with your account, and we’ll send you a link to reset your password."
              titleClassName="font-visby text-2xl font-semibold text-black"
              subtitleClassName="font-visby text-sm text-gray-500"
            />

            <AuthTextField
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              labelClassName="font-visby text-sm font-medium text-black"
              inputWrapperClassName="rounded-xl border border-green-400 px-4 py-3"
              inputClassName="font-visby text-sm text-black"
            />

            <AuthPrimaryButton title="Send" onPress={() => setIsSent(true)} />
          </View>
        ) : (
          <View className="gap-3 pt-16">
            <Text className="font-visby text-2xl font-semibold text-black">Check Your Mail</Text>
            <Text className="font-visby text-sm text-gray-500">
              We have sent a password recover instructions to your email.
            </Text>
            <Text className="font-visby text-xs text-gray-500">
              Did not receive the email? Check your spam folder or try another email address.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
