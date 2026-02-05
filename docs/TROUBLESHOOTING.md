# Troubleshooting Guide

## Common Issues and Solutions

### 1. Personalization API Error: "JSON Parse error: Unexpected character: <"

**Symptoms:**
```
ERROR  Personalization check error: [SyntaxError: JSON Parse error: Unexpected character: <]
ERROR  Failed to check personalization: [SyntaxError: JSON Parse error: Unexpected character: <]
```

**Root Cause:**
The API endpoint is returning HTML (usually an error page) instead of JSON. This can happen when:
1. ❌ API endpoint doesn't exist (404 Not Found)
2. ❌ Server error (500 Internal Server Error)
3. ❌ Wrong API URL configured
4. ❌ Backend server is down
5. ❌ CORS issues blocking the request

### 2. Personalization API Error: "401 Unauthorized - Invalid token"

**Symptoms:**
```
ERROR  ❌ Personalization check error response: {
  "body": "{\"success\":false,\"message\":\"Unauthorized - Invalid token\"}",
  "status": 401,
  "statusText": ""
}
ERROR  Personalization check error: [Error: Failed to check personalization: 401 - ]
```

**Root Cause:**
The service was using the wrong token. The backend expects the auth token from your backend API, not the Supabase JWT token.

**✅ FIXED:**
Updated `PersonalizationService` to use `TokenStorage.getToken()` which retrieves the correct backend auth token from AsyncStorage instead of Supabase JWT.

```typescript
// ❌ Before (Wrong - used Supabase JWT)
const { data: sessionData } = await supabase.auth.getSession();
const token = sessionData.session?.access_token;

// ✅ After (Correct - uses backend auth token)
const token = await TokenStorage.getToken();
```

**Solution Steps:**

#### Step 1: Check API URL Configuration
Verify your `.env` file has the correct API URL:
```bash
# .env
EXPO_PUBLIC_API_BASE_URL=https://recook.yogawanadityapratama.com
```

**Important:** After changing `.env`, restart your Metro bundler:
```bash
# Stop the current bundler (Ctrl+C)
# Clear cache and restart
npx expo start -c
```

#### Step 2: Verify API Endpoints
Check that these endpoints exist and are accessible:
- `GET /api/personalization/check`
- `POST /api/personalization`

Test with curl:
```bash
# Get your JWT token from Supabase
TOKEN="your-jwt-token-here"

# Test GET endpoint
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  https://recook.yogawanadityapratama.com/api/personalization/check

# Expected response (if user has personalization):
# {"success":true,"message":"User has personalization","data":{"hasPersonalization":true,"personalizationId":"xxx"}}

# Expected response (if user doesn't have personalization):
# {"success":true,"message":"User doesn't have personalization","data":{"hasPersonalization":false}}
```

#### Step 3: Check Backend Logs
Look at your backend server logs to see:
- Is the request reaching the server?
- What error is being thrown?
- Are the routes properly registered?

#### Step 4: Verify Authentication
Make sure the JWT token is valid:
```typescript
// In your app, check the token
const { data: sessionData } = await supabase.auth.getSession();
console.log('Token:', sessionData.session?.access_token);
```

#### Step 5: Temporary Workaround
If the API is not ready yet, you can temporarily disable the personalization check:

**Option A: Comment out the check in auth store**
```typescript
// lib/store/authStore.ts
// Comment out this block temporarily
/*
try {
  await PersonalizationService.checkPersonalization();
} catch (error) {
  // ...
}
*/
```

**Option B: Mock the service (for development)**
```typescript
// lib/services/personalizationService.ts
async checkPersonalization(): Promise<PersonalizationCheckResponse> {
  // TEMPORARY: Return mock data
  console.warn('⚠️ Using mock personalization data');
  return {
    success: true,
    message: "Mock response",
    data: {
      hasPersonalization: false, // Force user to onboarding
    }
  };
}
```

### 2. Enhanced Logging

The service now includes detailed logging to help debug:

```typescript
🔧 PersonalizationService initialized with API_BASE_URL: https://...
📡 Checking personalization at: https://.../api/personalization/check
📡 Personalization check response status: 404
❌ Personalization check error response: {
  status: 404,
  statusText: "Not Found",
  body: "<html>..."
}
```

**What to look for:**
- ✅ API_BASE_URL should be your actual backend URL
- ✅ Response status should be 200 for success
- ❌ Response status 404 = endpoint doesn't exist
- ❌ Response status 500 = server error
- ❌ HTML body = wrong endpoint or server error page

### 3. Non-Blocking Behavior

**Good News:** This error won't block user login! 

The app is designed to be resilient:
1. ✅ User can still sign in successfully
2. ✅ If personalization check fails, `hasOnboarded` stays `false`
3. ✅ User will be redirected to onboarding screen
4. ✅ User can complete onboarding and POST will be attempted

**Flow when API is down:**
```
Login → Personalization check fails (logged as warning)
      → hasOnboarded = false (default)
      → Redirect to /onboarding
      → User completes onboarding
      → POST /api/personalization (may also fail)
      → Show error alert, user can retry
```

### 4. Environment Variables

**Common mistake:** Using wrong env var name

```bash
# ❌ Wrong
EXPO_PUBLIC_API_URL=...

# ✅ Correct (check your .env)
EXPO_PUBLIC_API_BASE_URL=...
```

The service checks both:
```typescript
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL 
  || process.env.EXPO_PUBLIC_API_URL 
  || 'https://your-api-url.com';
```

### 5. CORS Issues

If you see network errors or CORS warnings, the backend needs to allow requests from your app:

**Backend CORS configuration example (Express.js):**
```javascript
app.use(cors({
  origin: '*', // For development - restrict in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

## Testing Checklist

Before deploying to production:

- [ ] Verify `.env` has correct `EXPO_PUBLIC_API_BASE_URL`
- [ ] Test GET `/api/personalization/check` with valid JWT
- [ ] Test POST `/api/personalization` with valid payload
- [ ] Check backend logs for errors
- [ ] Verify CORS configuration allows your app
- [ ] Test with new user (no personalization)
- [ ] Test with returning user (has personalization)
- [ ] Test when API is down (graceful degradation)

## Getting Help

If you're still stuck, gather this info:

1. **Full error logs** from React Native debugger
2. **API URL** being used (from logs: `🔧 PersonalizationService initialized...`)
3. **Response status** (from logs: `📡 Personalization check response status: ...`)
4. **Backend logs** from your server
5. **Network tab** from React Native Debugger (if available)

Then check:
- Is the backend running?
- Is the endpoint implemented?
- Is the JWT token valid?
- Are there any firewall/network issues?
