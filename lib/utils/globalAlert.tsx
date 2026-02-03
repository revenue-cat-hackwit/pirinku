import { Alert } from 'react-native';

/**
 * Global Alert Configuration Store
 * This allows us to trigger custom alerts from anywhere in the app
 */
class GlobalAlertManager {
  private showAlertCallback: ((config: AlertConfig) => void) | null = null;

  /**
   * Register the alert display function (called from _layout.tsx)
   */
  register(callback: (config: AlertConfig) => void) {
    this.showAlertCallback = callback;
  }

  /**
   * Unregister the alert display function
   */
  unregister() {
    this.showAlertCallback = null;
  }

  /**
   * Show a custom alert
   * Falls back to React Native Alert if custom modal is not available
   */
  show(
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: {
      icon?: React.ReactNode;
      type?: 'default' | 'destructive';
    },
  ) {
    // If custom alert is registered, use it
    if (this.showAlertCallback) {
      const config: AlertConfig = {
        visible: true,
        title,
        message: message || '',
        icon: options?.icon,
        type: options?.type || 'default',
        confirmText: 'OK',
        showCancel: false,
        onConfirm: () => {},
      };

      // Handle buttons
      if (buttons && buttons.length > 0) {
        // Find cancel button
        const cancelButton = buttons.find((b) => b.style === 'cancel');
        const destructiveButton = buttons.find((b) => b.style === 'destructive');
        const defaultButton = buttons.find((b) => !b.style || b.style === 'default');

        if (cancelButton) {
          config.showCancel = true;
          config.cancelText = cancelButton.text;
          config.onCancel = cancelButton.onPress;
        }

        // Primary button (destructive or default)
        const primaryButton = destructiveButton || defaultButton || buttons[buttons.length - 1];
        if (primaryButton) {
          config.confirmText = primaryButton.text || 'OK';
          config.onConfirm = primaryButton.onPress || (() => {});
          if (primaryButton.style === 'destructive') {
            config.type = 'destructive';
          }
        }
      }

      this.showAlertCallback(config);
    } else {
      // Fallback to native Alert
      console.warn('Custom alert not registered, falling back to native Alert');
      const nativeButtons = buttons?.map((b) => ({
        text: b.text,
        onPress: b.onPress,
        style: b.style,
      }));
      Alert.alert(title, message, nativeButtons);
    }
  }
}

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertConfig {
  visible: boolean;
  title: string;
  message: string;
  icon?: React.ReactNode;
  type?: 'default' | 'destructive';
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

// Export singleton instance
export const GlobalAlert = new GlobalAlertManager();

/**
 * Drop-in replacement for Alert.alert
 * Usage: showAlert('Title', 'Message', [buttons])
 */
export const showAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: {
    icon?: React.ReactNode;
    type?: 'default' | 'destructive';
  },
) => {
  GlobalAlert.show(title, message, buttons, options);
};
