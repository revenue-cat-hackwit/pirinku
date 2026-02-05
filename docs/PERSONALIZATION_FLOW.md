# Personalization Flow Documentation

## Overview
This document explains how the personalization APIs are integrated into the Pirinku app to manage user onboarding flow.

## API Endpoints

### 1. GET /api/personalization/check

Check if user has filled personalization data.

**Headers:**
```
Authorization: Bearer <supabase_jwt_token>
Content-Type: application/json
```

**Response 1 - User has personalization:**
```json
{
  "success": true,
  "message": "User has personalization",
  "data": {
    "hasPersonalization": true,
    "personalizationId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

**Response 2 - User doesn't have personalization:**
```json
{
  "success": true,
  "message": "User doesn't have personalization",
  "data": {
    "hasPersonalization": false
  }
}
```

### 2. POST /api/personalization

Save user personalization preferences.

**Headers:**
```
Authorization: Bearer <supabase_jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "favoriteCuisines": ["Italian", "Japanese", "Indonesian"],
  "tastePreferences": ["Spicy", "Sweet"],
  "foodAllergies": ["Peanuts", "Seafood"],
  "whatsInYourKitchen": ["Oven", "Air Fryer", "Microwave"],
  "otherTools": ["Blender", "Food Processor"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Personalization saved successfully",
  "data": {
    "personalization": {
      "id": "6984cc8f25b2109c91d3afe7",
      "userId": "697f8ebe73916d63e3b2fa62",
      "favoriteCuisines": ["Italian", "Japanese", "Indonesian"],
      "tastePreferences": ["Spicy", "Sweet"],
      "foodAllergies": ["Peanuts", "Seafood"],
      "whatsInYourKitchen": ["Oven", "Air Fryer", "Microwave"],
      "otherTools": ["Blender", "Food Processor"],
      "createdAt": "2026-02-05T16:59:58.064Z",
      "updatedAt": "2026-02-05T16:59:58.064Z"
    }
  }
}
```

## Implementation

### 1. PersonalizationService (`/lib/services/personalizationService.ts`)

Service layer that handles API communication:

```typescript
export const PersonalizationService = {
  // Check personalization status from API
  async checkPersonalization(): Promise<PersonalizationCheckResponse>
  
  // Save personalization data to API
  async savePersonalization(data: PersonalizationData): Promise<PersonalizationResponse>
  
  // Save personalization status locally (deprecated - now using PreferencesStore)
  async savePersonalizationStatus(hasPersonalization: boolean, personalizationId?: string)
}
```

**Key Features:**
- Automatically gets JWT token from Supabase session
- Updates `PreferencesStore.hasOnboarded` after successful save
- Handles errors gracefully
- Converts local preferences format to API format

### 2. Auth Store Integration (`/lib/store/authStore.ts`)

The personalization check is called automatically after successful authentication:

**Triggers:**
1. **Sign In** - After email/password login
2. **Verify OTP** - After OTP verification (sign up)
3. **Google Sign-In** - After successful Google authentication

```typescript
// Example: In signIn method
const response = await AuthApiService.login(email, password);
set({ token: response.data.token, user: response.data.user });

// Auto-check personalization
try {
  await PersonalizationService.checkPersonalization();
} catch (error) {
  console.error('Failed to check personalization:', error);
  // Don't block login if check fails
}
```

**Why in Auth Store?**
- Centralized: All login methods check personalization
- Automatic: No need to manually trigger check
- Non-blocking: Login succeeds even if check fails

### 3. Routing Logic (`/app/index.tsx`)

The app uses a centralized routing strategy at the root index to determine user navigation:

```typescript
export default function Index() {
  const token = useAuthStore((state) => state.token);
  const hasOnboarded = usePreferencesStore((state) => state.hasOnboarded);

  // Not authenticated -> go to sign in
  if (!token) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // Authenticated but not onboarded -> go to onboarding
  if (!hasOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  // Authenticated and onboarded -> go to main app
  return <Redirect href="/(tabs)/feed" />;
}
```

**Why Centralized Routing?**
- **Single Source of Truth**: All navigation logic in one place
- **Easy to Debug**: Clear flow of user journey
- **Predictable**: Every auth action redirects to `/` which handles routing
- **Maintainable**: No scattered redirect logic across layouts

**Route Destinations:**
1. All auth screens (sign-in, sign-up, verify-otp) → Redirect to `/`
2. Onboarding completion → Redirect to `/`
3. Index checks status and routes appropriately

### 4. Layout Changes

**`/app/(auth)/_layout.tsx`:**
- Removed redirect logic (no longer checks token)
- Just renders Stack for auth screens

**`/app/(tabs)/_layout.tsx`:**
- Removed redirect logic (no longer checks token or hasOnboarded)
- Just renders Tabs for main app screens

**Why Remove Layout Redirects?**
- Prevents redirect conflicts and loops
- Layouts are now "dumb" - they just render UI
- Routing intelligence moved to index.tsx

### 5. Onboarding Screen (`/app/onboarding.tsx`)

**Current Flow:**
- Loads preference options (cuisines, allergies, equipment) from Supabase
- User selects preferences across 4 steps:
  1. Favorite Cuisines
  2. Taste Preferences (dislikes)
  3. Food Allergies
  4. Kitchen Equipment + Other Tools
- On finish:
  1. Prepares data in API format
  2. Calls `PersonalizationService.savePersonalization()`
  3. Updates local state with `completeOnboarding()`
  4. Shows success alert
  5. Redirects to main app

**Data Mapping:**
```typescript
const personalizationData = {
  favoriteCuisines: preferences.cuisines,           // ["Italian", "Japanese"]
  tastePreferences: preferences.tastePreferences,   // ["Spicy", "Sweet"]
  foodAllergies: preferences.allergies,             // ["Peanuts", "Seafood"]
  whatsInYourKitchen: preferences.equipment,        // ["Oven", "Air Fryer"]
  otherTools: otherTools.split(',').map(tool => tool.trim()).filter(Boolean)  // ["Blender"]
};
```

**Error Handling:**
- Shows user-friendly error alert if save fails
- Displays error message from API
- Prevents navigation until successful save

## User Flow Diagram

```
┌─────────────────┐
│   User Logs In  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ Auth Store                  │
│ - Login successful          │
│ - Call checkPersonalization │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ PersonalizationService      │
│ GET /api/personalization/   │
│          check              │
└────────┬────────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌────────┐
│ true  │ │ false  │
└───┬───┘ └───┬────┘
    │         │
    │         ▼
    │    ┌──────────────────┐
    │    │ hasOnboarded =   │
    │    │ false (default)  │
    │    └────────┬─────────┘
    │             │
    │             ▼
    │    ┌──────────────────┐
    │    │ Redirect to      │
    │    │ /onboarding      │
    │    └────────┬─────────┘
    │             │
    │             ▼
    │    ┌──────────────────┐
    │    │ User fills       │
    │    │ 4-step form      │
    │    └────────┬─────────┘
    │             │
    │             ▼
    │    ┌──────────────────┐
    │    │ POST /api/       │
    │    │ personalization  │
    │    └────────┬─────────┘
    │             │
    │          Success
    │             │
    ▼             ▼
┌─────────────────────────────┐
│ hasOnboarded = true         │
│ Show Main App (/(tabs)/)    │
└─────────────────────────────┘
```

## Benefits of This Approach

1. **Automatic**: No manual intervention needed
2. **Consistent**: All login methods follow same flow
3. **User-Friendly**: Skip onboarding if already completed
4. **Resilient**: Continues even if API check fails
5. **Centralized**: Single source of truth (PreferencesStore)
6. **Backend Sync**: Data saved to backend for cross-device access
7. **Idempotent**: Can complete onboarding multiple times safely

## Configuration

Make sure to set the API URL in your environment:

```env
EXPO_PUBLIC_API_URL=https://your-api-url.com
```

## Error Handling

All personalization checks are wrapped in try-catch:
- Errors are logged to console
- User experience is not blocked
- Defaults to showing onboarding if uncertain

## Testing Scenarios

1. **New User (No Personalization):**
   - Login → API returns `hasPersonalization: false`
   - Redirected to onboarding
   - Fill 4 steps of preferences
   - Submit → POST /api/personalization
   - Success → Navigate to main app

2. **Returning User (Has Personalization):**
   - Login → API returns `hasPersonalization: true`
   - `hasOnboarded` set to `true`
   - Navigate directly to main app

3. **API Failure (GET check):**
   - Login → API check fails
   - `hasOnboarded` remains `false` (default)
   - Redirected to onboarding (safe default)

4. **API Failure (POST save):**
   - User completes onboarding
   - POST fails with error
   - Show error alert to user
   - User can retry submission
   - Stays on onboarding screen

5. **Incomplete Form:**
   - User skips selections (all optional)
   - Can still submit with empty arrays
   - Backend saves empty preferences

## Future Enhancements

- Cache personalization status with timestamp
- Add refresh mechanism for personalization data
- Support partial onboarding completion
- Add analytics for onboarding completion rate
- Add PATCH endpoint for updating preferences
- Sync preferences with Supabase user_preferences table

## Example Usage

### Manually trigger personalization check
```typescript
import { PersonalizationService } from '@/lib/services/personalizationService';

// Check if user has personalization
const result = await PersonalizationService.checkPersonalization();
console.log('Has personalization:', result.data.hasPersonalization);
```

### Save personalization from code
```typescript
import { PersonalizationService } from '@/lib/services/personalizationService';

const data = {
  favoriteCuisines: ['Italian', 'Japanese'],
  tastePreferences: ['Spicy'],
  foodAllergies: ['Peanuts'],
  whatsInYourKitchen: ['Oven', 'Air Fryer'],
  otherTools: ['Blender']
};

const result = await PersonalizationService.savePersonalization(data);
console.log('Saved:', result.data.personalization.id);
```

### Access preferences in app
```typescript
import { usePreferencesStore } from '@/lib/store/preferencesStore';

function MyComponent() {
  const { hasOnboarded, preferences } = usePreferencesStore();
  
  return (
    <View>
      <Text>Onboarded: {hasOnboarded ? 'Yes' : 'No'}</Text>
      <Text>Cuisines: {preferences.cuisines.join(', ')}</Text>
    </View>
  );
}
```
