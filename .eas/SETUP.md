# EAS Workflows Setup

## 🚀 Auto-Triggered Workflows

### 1. Production Build & Deploy
- **Trigger:** Push to `main` branch
- **Action:** Build Android AAB → Submit to Google Play Internal Testing
- **File:** `.eas/workflows/production-build.yml`

### 2. Preview Build
- **Trigger:** Push to `develop` branch  
- **Action:** Build Android APK for internal testing
- **File:** `.eas/workflows/preview-build.yml`

### 3. Pull Request Checks
- **Trigger:** PR to `main` or `develop`
- **Action:** Run lint & TypeScript type check
- **File:** `.eas/workflows/pull-request-check.yml`

## 📋 Setup Steps

1. **Connect GitHub Repository**
   - Go to: https://expo.dev/accounts/[account]/projects/[project]/github
   - Install GitHub app
   - Connect your repository

2. **Configure Google Play Credentials** (for auto-submit)
   ```bash
   npx eas credentials
   ```
   - Select Android → Production → Google Service Account
   - Upload your service account JSON key

3. **Test Workflow Manually** (optional)
   ```bash
   npx eas workflow:run production-build.yml
   ```

## ✅ Done!
Push to `main` or `develop` and workflows will auto-trigger!
