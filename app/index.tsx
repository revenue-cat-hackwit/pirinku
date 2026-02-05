import { useAuthStore } from '@/lib/store/authStore';
import { usePreferencesStore } from '@/lib/store/preferencesStore';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const token = useAuthStore((state) => state.token);
  const hasOnboarded = usePreferencesStore((state) => state.hasOnboarded);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Give a moment for stores to hydrate from AsyncStorage
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#8BD65E" />
      </View>
    );
  }

  // Not authenticated -> go to sign in
  if (!token) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // Authenticated but not onboarded -> go to personalization
  if (!hasOnboarded) {
    return <Redirect href="/personalization" />;
  }

  // Authenticated and onboarded -> go to main app
  return <Redirect href="/(tabs)/feed" />;
}
