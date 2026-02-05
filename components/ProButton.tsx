import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import { Diamonds, TickCircle } from 'iconsax-react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import { useSubscriptionStore } from '@/lib/store/subscriptionStore';
import { SubscriptionService } from '@/lib/services/subscriptionService';

interface ProButtonProps {
  onPress?: () => void;
}

export const ProButton: React.FC<ProButtonProps> = ({ onPress }) => {
  const { initialize } = useSubscriptionStore();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscriptionType, setSubscriptionType] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkSubscription = async () => {
      try {
        console.log('🔄 ProButton: Checking subscription...');
        const response = await SubscriptionService.getUserPlan();
        console.log('📦 ProButton: Response received:', response.data);
        if (isMounted) {
          setIsSubscribed(response.data.isSubscribed);
          setSubscriptionType(response.data.subscriptionType);
          setLoading(false);
          console.log('✅ ProButton: State updated - subscribed:', response.data.isSubscribed);
        } else {
          console.log('⚠️ ProButton: Component unmounted, skipping state update');
        }
      } catch (error) {
        console.error('❌ ProButton: Failed to check subscription:', error);
        if (isMounted) {
          setIsSubscribed(false);
          setLoading(false);
        }
      }
    };

    // Delay check to ensure navigation is ready
    const timer = setTimeout(() => {
      checkSubscription();
    }, 100);

    return () => {
      clearTimeout(timer);
      isMounted = false;
    };
  }, []);

  const refreshSubscription = async () => {
    try {
      setLoading(true);
      const response = await SubscriptionService.getUserPlan();
      setIsSubscribed(response.data.isSubscribed);
      setSubscriptionType(response.data.subscriptionType);
    } catch (error) {
      console.error('Failed to refresh subscription:', error);
      setIsSubscribed(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = async () => {
    try {
      if (onPress) {
        onPress();
        return;
      }

      // Default behavior: show paywall
      const paywallResult = await RevenueCatUI.presentPaywall();
      if (
        paywallResult === RevenueCatUI.PAYWALL_RESULT.PURCHASED ||
        paywallResult === RevenueCatUI.PAYWALL_RESULT.RESTORED
      ) {
        await initialize();
        await refreshSubscription(); // Refresh subscription status
      }
    } catch (error) {
      console.error('Error in ProButton handlePress:', error);
    }
  };

  if (loading) {
    console.log('🔄 ProButton: Rendering loading state');
    return (
      <View className="flex-row items-center gap-1.5 rounded-full bg-gray-200 px-4 py-2">
        <ActivityIndicator size="small" color="#8BD65E" />
      </View>
    );
  }

  if (isSubscribed) {
    console.log('✅ ProButton: Rendering subscribed state:', subscriptionType);
    return (
      <View className="flex-row items-center gap-1.5 rounded-full bg-[#8BD65E] px-4 py-2">
        <TickCircle size={16} color="white" variant="Bold" />
        <Text className="font-visby-bold text-sm text-white">
          {subscriptionType === 'weekly' ? 'Pro Weekly' : subscriptionType === 'monthly' ? 'Pro Monthly' : 'Pro'}
        </Text>
      </View>
    );
  }

  console.log('💎 ProButton: Rendering free state');
  return (
    <TouchableOpacity
      onPress={handlePress}
      className="flex-row items-center gap-1.5 rounded-full bg-[#8BD65E] px-4 py-2"
      activeOpacity={0.8}
    >
      <Diamonds size={16} color="white" variant="Bold" />
      <Text className="font-visby-bold text-sm text-white">Pro</Text>
    </TouchableOpacity>
  );
};

export default ProButton;
