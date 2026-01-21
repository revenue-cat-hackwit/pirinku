import AuthFooterLink from '@/components/auth/AuthFooterLink';
import AuthHeader from '@/components/auth/AuthHeader';
import AuthPasswordField from '@/components/auth/AuthPasswordField';
import AuthPrimaryButton from '@/components/auth/AuthPrimaryButton';
import AuthSocialButton from '@/components/auth/AuthSocialButton';
import AuthTextField from '@/components/auth/AuthTextField';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignUpPage() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-10">
        <AuthHeader
          title="Create Account"
          subtitle="Create an account to start your culinary journey"
        />

        <View className="mt-6 gap-5">
          <AuthTextField label="Username" placeholder="Your username" autoCapitalize="none" />
          <AuthTextField
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <AuthPasswordField label="Password" placeholder="••••••••" />
          <AuthPasswordField label="Confirm Password" placeholder="••••••••" />
        </View>

        <AuthPrimaryButton title="Sign Up" containerClassName="mt-6" />

        <View className="mt-auto gap-4">
          <AuthSocialButton
            title="Sign Up with Google"
            icon={<FontAwesome6 name="google" size={20} color="#4285F4" />}
          />

          <AuthFooterLink
            text="Already have an account? "
            linkText="Sign in"
            onPress={() => router.push('/(auth)/sign-in')}
            containerClassName="flex-row items-center justify-center pb-2"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
