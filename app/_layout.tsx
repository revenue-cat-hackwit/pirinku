import { useAuthStore } from '@/lib/store/authStore';
import { useSubscriptionStore } from '@/lib/store/subscriptionStore';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import '../global.css';
import { useSettingsStore } from '@/lib/store/settingsStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { CustomAlertModal } from '@/components/CustomAlertModal';
import { GlobalAlert, AlertConfig } from '@/lib/utils/globalAlert';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [globalAlertConfig, setGlobalAlertConfig] = useState<AlertConfig>({
    visible: false,
    title: '',
    message: '',
    confirmText: 'OK',
    showCancel: false,
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Parallelize initialization for speed
        await Promise.all([
          useSettingsStore.getState().loadTheme(),
          useSettingsStore.getState().loadLanguage(),
          useSubscriptionStore.getState().initialize(),
          useAuthStore.getState().initializeAuth(),
        ]);
      } catch (e) {
        console.warn('Error loading app resources:', e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  // Register global alert
  useEffect(() => {
    GlobalAlert.register((config) => {
      setGlobalAlertConfig(config);
    });

    return () => {
      GlobalAlert.unregister();
    };
  }, []);

  const closeGlobalAlert = () => {
    setGlobalAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  if (!appIsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" backgroundColor="#ffffff" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="personalization" />
        <Stack.Screen name="edit-profile" options={{ presentation: 'modal' }} />
        <Stack.Screen name="shopping-list" options={{ presentation: 'modal' }} />
        <Stack.Screen name="meal-planner" options={{ presentation: 'modal' }} />
        <Stack.Screen name="pantry" options={{ presentation: 'modal' }} />
        <Stack.Screen name="nutrition-analyzer" options={{ presentation: 'modal' }} />
      </Stack>

      {/* Global Alert Modal */}
      <CustomAlertModal
        visible={globalAlertConfig.visible}
        title={globalAlertConfig.title}
        message={globalAlertConfig.message}
        type={globalAlertConfig.type}
        icon={globalAlertConfig.icon}
        confirmText={globalAlertConfig.confirmText}
        cancelText={globalAlertConfig.cancelText}
        showCancel={globalAlertConfig.showCancel}
        onClose={closeGlobalAlert}
        onConfirm={() => {
          globalAlertConfig.onConfirm?.();
          closeGlobalAlert();
        }}
        onCancel={() => {
          globalAlertConfig.onCancel?.();
          closeGlobalAlert();
        }}
      />
    </GestureHandlerRootView>
  );
}
