import { useAuthStore } from '@/lib/store/authStore';
import { useSubscriptionStore } from '@/lib/store/subscriptionStore';
import { supabase } from '@/lib/supabase';
import * as Linking from 'expo-linking';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import Purchases from 'react-native-purchases';
import '../global.css';
import { useSettingsStore } from '@/lib/store/settingsStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  useEffect(() => {
    useSettingsStore.getState().loadTheme();
  }, []);

  useEffect(() => {
    useSubscriptionStore.getState().initialize();
  }, []);

  useEffect(() => {
    useSettingsStore.getState().loadLanguage();
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Supabase Auth Event:', event);

      //NOTE - Update Auth Store on Auth State Change only for INITIAL_SESSION , TOKEN_REFRESHED and USER_UPDATED because other events are handled explicitly in the Auth Store actions
      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        useAuthStore.getState().setCredentials(session, session?.user ?? null);
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    (async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleUrl(initialUrl);
      }
    })();

    const sub = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    return () => sub.remove();
  }, []);

  const handleUrl = (url: string) => {
    const isResetPassword = Linking.parse(url).hostname === 'reset-password';
    if (isResetPassword) {
      useAuthStore.getState().setCredentialsFromUrl(url);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="edit-profile" options={{ presentation: 'modal' }} />
        <Stack.Screen name="shopping-list" options={{ presentation: 'modal' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
