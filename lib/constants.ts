export const VOICES = [
  {
    id: 'Wise_Woman',
    name: 'Wise Woman',
    emotion: 'happy',
    description: 'Wise Lady',
    asset: require('../assets/voices/Wise_Woman.mp3'),
  },
  {
    id: 'Friendly_Person',
    name: 'Friendly',
    emotion: 'happy',
    description: 'Best Friend',
    asset: require('../assets/voices/Friendly_Person.mp3'),
  },
  {
    id: 'Deep_Voice_Man',
    name: 'Deep Voice',
    emotion: 'neutral',
    description: 'Mature Man',
    asset: require('../assets/voices/Deep_Voice_Man.mp3'),
  },
  {
    id: 'Lively_Girl',
    name: 'Lively Girl',
    emotion: 'happy',
    description: 'Cheerful',
    asset: require('../assets/voices/Lively_Girl.mp3'),
  },
  {
    id: 'Young_Knight',
    name: 'Knight',
    emotion: 'neutral',
    description: 'Young Man',
    asset: require('../assets/voices/Young_Knight.mp3'),
  },
  {
    id: 'Sweet_Girl_2',
    name: 'Sweet Girl',
    emotion: 'happy',
    description: 'Sweet',
    asset: require('../assets/voices/Sweet_Girl_2.mp3'),
  },
];

export const SPEEDS = [
  { value: 0.8, label: 'Slow' },
  { value: 1.0, label: 'Normal' },
  { value: 1.2, label: 'Fast' },
];

export const EMOTIONS = [
  { value: 'happy', label: 'Happy 😊' },
  { value: 'serious', label: 'Serious 😐' },
  { value: 'excited', label: 'Excited 🤩' },
  { value: 'soothing', label: 'Soothing 😌' },
];

// --- REVENUECAT CONSTANTS ---
export const ENTITLEMENT_ID = 'pirinku Pro';

export const REVENUECAT_API_KEYS = {
  apple: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY!,
  google: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY!,
};

export const FREE_GENERATION_LIMIT = 3;
