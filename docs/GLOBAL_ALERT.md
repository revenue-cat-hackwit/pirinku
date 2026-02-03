# Global Alert System

## Overview

Global Alert System adalah replacement untuk `Alert.alert` bawaan React Native
yang menggunakan custom modal dengan design yang lebih indah dan konsisten.

## Setup

Global alert sudah di-setup di `app/_layout.tsx` dan siap digunakan di seluruh
aplikasi.

## Usage

### Import

```typescript
import { showAlert } from '@/lib/utils/globalAlert';
```

### Basic Usage

```typescript
// Simple alert
showAlert('Success', 'Your changes have been saved!');

// Alert with single button
showAlert('Error', 'Something went wrong');
```

### With Buttons

```typescript
// Alert with cancel and confirm
showAlert('Delete Item', 'Are you sure you want to delete this item?', [
  {
    text: 'Cancel',
    style: 'cancel',
  },
  {
    text: 'Delete',
    style: 'destructive',
    onPress: () => {
      // Handle delete
      console.log('Item deleted');
    },
  },
]);
```

### With Custom Icon

```typescript
import { Danger, TickCircle } from "iconsax-react-native";

// Success alert with icon
showAlert(
    "Success!",
    "Your recipe has been saved.",
    undefined,
    {
        icon: <TickCircle size={32} color="#10B981" variant="Bold" />,
    },
);

// Error alert with icon
showAlert(
    "Error",
    "Failed to upload image.",
    undefined,
    {
        icon: <Danger size={32} color="#EF4444" variant="Bold" />,
        type: "destructive",
    },
);
```

### Replacing Existing Alert.alert

**Before:**

```typescript
Alert.alert('Success', 'Profile updated successfully!');
```

**After:**

```typescript
showAlert('Success', 'Profile updated successfully!');
```

**Before (with buttons):**

```typescript
Alert.alert('Delete Recipe', 'Are you sure?', [
  { text: 'Cancel', style: 'cancel' },
  { text: 'Delete', style: 'destructive', onPress: handleDelete },
]);
```

**After (with buttons):**

```typescript
showAlert('Delete Recipe', 'Are you sure?', [
  { text: 'Cancel', style: 'cancel' },
  { text: 'Delete', style: 'destructive', onPress: handleDelete },
]);
```

## API

### showAlert(title, message?, buttons?, options?)

**Parameters:**

- `title` (string): Alert title
- `message` (string, optional): Alert message
- `buttons` (AlertButton[], optional): Array of buttons
- `options` (object, optional):
  - `icon` (React.ReactNode): Custom icon component
  - `type` ('default' | 'destructive'): Alert type

**AlertButton:**

```typescript
{
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}
```

## Features

- ✅ Drop-in replacement for `Alert.alert`
- ✅ Custom icons support
- ✅ Smooth animations (zoom in/out)
- ✅ Dark mode support
- ✅ Consistent design across the app
- ✅ Fallback to native Alert if not registered

## Migration Guide

To migrate from `Alert.alert` to `showAlert`:

1. Add import:

```typescript
import { showAlert } from '@/lib/utils/globalAlert';
```

2. Replace `Alert.alert` with `showAlert`:

```typescript
// Find and replace
Alert.alert → showAlert
```

3. (Optional) Remove `Alert` import if no longer used:

```typescript
// Remove this if not used elsewhere
import { Alert } from 'react-native';
```

## Examples in Codebase

See these files for examples:

- `app/meal-planner.tsx` - Shopping cart alerts
- `app/_layout.tsx` - Global alert setup
