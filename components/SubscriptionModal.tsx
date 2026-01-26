import React from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import { useSubscriptionStore } from '@/lib/store/subscriptionStore';

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SubscriptionModal = ({ visible, onClose }: SubscriptionModalProps) => {
  const { initialize } = useSubscriptionStore();

  const handleCompletion = async (customerInfo: any) => {
    // Refresh status di store
    await initialize();
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <RevenueCatUI.Paywall
          onPurchaseCompleted={({ customerInfo }) => handleCompletion(customerInfo)}
          onRestoreCompleted={({ customerInfo }) => handleCompletion(customerInfo)}
          onDismiss={onClose}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
