import { useAuthStore } from '@/lib/store/authStore';
import { supabase } from '@/lib/supabase';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const setCredentials = useAuthStore((state) => state.setCredentials);
  const [fontsLoaded, error] = useFonts({
    'VisbyCF-Regular': require('../assets/fonts/VisbyCF-Regular.otf'),
    'VisbyCF-Medium': require('../assets/fonts/VisbyCF-Medium.otf'),
    'VisbyCF-DemiBold': require('../assets/fonts/VisbyCF-DemiBold.otf'),
  });

  useEffect(() => {
    if (fontsLoaded || error) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user || null;
      setCredentials(session, user);
    });

    return () => {
      subscription.unsubscribe();
    };
  });

  if (!fontsLoaded && !error) {
    return null;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
