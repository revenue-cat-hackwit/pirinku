import { create } from 'zustand';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';
import { SubscriptionState } from '@/lib/types';
import { ENTITLEMENT_ID, REVENUECAT_API_KEYS, FREE_GENERATION_LIMIT } from '@/lib/constants';

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  isPro: false,
  offerings: null,
  currentCustomerInfo: null,
  loading: false,

  generatedToday: 0,
  lastGeneratedDate: null,

  initialize: async () => {
    // ... (kode initialize yang lama tetap di sini, saya hanya menambah properties di atas)
    // Note: Untuk brevity saya tidak menulis ulang initialize(), asumsikan merged correctly
    // Real implementation below tries to keep previous code intact

    set({ loading: true });
    try {
      if (Platform.OS === 'ios') {
        Purchases.configure({ apiKey: REVENUECAT_API_KEYS.apple });
      } else if (Platform.OS === 'android') {
        Purchases.configure({ apiKey: REVENUECAT_API_KEYS.google });
      }

      await Purchases.setLogLevel(Purchases.LOG_LEVEL.WARN);

      let customerInfo = null;
      try {
        customerInfo = await Purchases.getCustomerInfo();
      } catch (e) {
        console.error('Failed to get customer info:', e);
      }

      let offerings = null;
      try {
        const offeringsData = await Purchases.getOfferings();
        offerings = offeringsData.current;
      } catch (e) {
        console.log('Offerings fetch failed (Check RC Dashboard):', e);
      }

      const isPro = customerInfo?.entitlements.active[ENTITLEMENT_ID] !== undefined;

      // Check Local Daily Usage Reset
      const today = new Date().toDateString();
      const lastDate = get().lastGeneratedDate;

      let currentUsage = get().generatedToday;
      if (lastDate !== today) {
        currentUsage = 0; // Reset if new day
      }

      set({
        currentCustomerInfo: customerInfo,
        offerings: offerings,
        isPro,
        generatedToday: currentUsage,
        lastGeneratedDate: today,
        loading: false,
      });

      console.log('RevenueCat Initialized. Pro:', isPro, 'Usage:', currentUsage);
    } catch (e) {
      console.error('RevenueCat Init Critical Error:', e);
      set({ loading: false });
    }
  },

  purchasePackage: async (pack: PurchasesPackage) => {
    set({ loading: true });
    try {
      const { customerInfo } = await Purchases.purchasePackage(pack);
      const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

      set({
        currentCustomerInfo: customerInfo,
        isPro,
        loading: false,
      });

      return isPro;
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error('Purchase Error:', e);
      }
      set({ loading: false });
      return false;
    }
  },

  restorePurchases: async () => {
    set({ loading: true });
    try {
      const customerInfo = await Purchases.restorePurchases();
      const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

      set({
        currentCustomerInfo: customerInfo,
        isPro,
        loading: false,
      });

      return isPro;
    } catch (e) {
      console.error('Restore Error:', e);
      set({ loading: false });
      return false;
    }
  },

  checkCanGenerate: () => {
    const { isPro, generatedToday, lastGeneratedDate } = get();

    // Always allow if Pro
    if (isPro) return true;

    // Check if day reset needed
    const today = new Date().toDateString();
    if (lastGeneratedDate !== today) {
      set({ generatedToday: 0, lastGeneratedDate: today });
      return true;
    }

    // Limit for Free users
    return generatedToday < FREE_GENERATION_LIMIT;
  },

  incrementUsage: () => {
    const { generatedToday, lastGeneratedDate } = get();
    const today = new Date().toDateString();

    if (lastGeneratedDate !== today) {
      set({ generatedToday: 1, lastGeneratedDate: today });
    } else {
      set({ generatedToday: generatedToday + 1 });
    }
  },
}));
