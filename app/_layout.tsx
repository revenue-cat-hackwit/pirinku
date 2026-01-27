import { useAuthStore } from '@/lib/store/authStore';
import { useSubscriptionStore } from '@/lib/store/subscriptionStore';
import { usePreferencesStore } from '@/lib/store/preferencesStore';
import { useSettingsStore } from '@/lib/store/settingsStore';
import { useColorScheme } from 'nativewind';
import { supabase } from '@/lib/supabase';
import * as Linking from 'expo-linking';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Purchases from 'react-native-purchases';
import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const setCredentials = useAuthStore((state) => state.setCredentials);
  const setCredentialsFromUrl = useAuthStore((state) => state.setCredentialsFromUrl);
  const session = useAuthStore((state) => state.session);
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (navigationState?.key) {
        setIsReady(true);
    }
  }, [navigationState?.key]);

  useEffect(() => {
    // Initialize Theme
    const loadTheme = useSettingsStore.getState().loadTheme;
    loadTheme();
  }, []);

  useEffect(() => {
    SplashScreen.hideAsync();
    // Initialize RevenueCat
    useSubscriptionStore.getState().initialize();
  }, []);

  // Theme Sync using nativewind v4 logic (or standard)
  const theme = useSettingsStore((state) => state.theme);
  const { colorScheme, setColorScheme } = useColorScheme();

  useEffect(() => {
      if (theme === 'dark') {
          setColorScheme('dark');
      } else {
          setColorScheme('light');
      }
  }, [theme]);

  useEffect(() => {
    // 1. Wait until navigation is ready (CRITICAL FIX)
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (session) {
       // User is logged in
       const hasOnboarded = usePreferencesStore.getState().hasOnboarded;

       if (!hasOnboarded && !inOnboarding) {
           // Redirect to onboarding if not there
           router.replace('/onboarding');
       } else if (hasOnboarded && (inAuthGroup || inOnboarding)) {
           // Redirect to home if in auth/onboarding but finished
           router.replace('/(tabs)/feed');
       }
    } else {
       // Not logged in
       if (!inAuthGroup) {
          router.replace('/(auth)/sign-in');
       }
    }
  }, [session, segments, isReady]);

  useEffect(() => {
    // Supabase Auth Listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Supabase Auth Event:', event);

      if (
        event === 'INITIAL_SESSION' ||
        event === 'SIGNED_IN' ||
        event === 'USER_UPDATED' ||
        event === 'TOKEN_REFRESHED'
      ) {
        const user = session?.user || null;
        setCredentials(session, user);
        
        // IDENTIFY USER IN REVENUECAT
        if (user && user.id) {
            try {
                await Purchases.logIn(user.id);
                console.log('RevenueCat: Identified user', user.id);
            } catch (e) {
                console.error('RevenueCat Login Error:', e);
            }
        }
        
      } else if (event === 'SIGNED_OUT') {
        setCredentials(null, null);
        
        // LOGOUT FROM REVENUECAT
        try {
            await Purchases.logOut();
            console.log('RevenueCat: User logged out');
        } catch (e) {
            console.error('RevenueCat Logout Error:', e);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Deep Linking Handler
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
      setCredentialsFromUrl(url);
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
