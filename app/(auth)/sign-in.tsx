import AuthFooterLink from '@/components/auth/AuthFooterLink';
import AuthHeader from '@/components/auth/AuthHeader';
import AuthPasswordField from '@/components/auth/AuthPasswordField';
import AuthPrimaryButton from '@/components/auth/AuthPrimaryButton';
import AuthTextField from '@/components/auth/AuthTextField';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignInPage() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-10">
        <AuthHeader
          title="Welcome Back!"
          subtitle="Enter your details to get back in the kitchen."
          subtitleClassName="font-visby-medium text-base text-slate-700"
        />

        <View className="mt-8 gap-5">
          <AuthTextField
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View className="gap-2">
            <AuthPasswordField label="Password" placeholder="••••••••" />
            <AuthFooterLink
              linkText="Forgot Password?"
              onPress={() => router.push('/(auth)/forgot-password')}
              containerClassName="self-start"
              linkClassName="font-visby-medium text-base text-green-500"
            />
          </View>
        </View>

        <AuthPrimaryButton title="Login" containerClassName="mt-6" />

        <AuthFooterLink
          text="Don't have an account? "
          linkText="Sign up"
          onPress={() => router.push('/(auth)/sign-up')}
          containerClassName="mt-auto flex-row items-center justify-center pb-6"
        />
      </View>
    </SafeAreaView>
  );
}
