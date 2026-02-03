import React, { useState, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import { CameraView, useCameraPermissions, FlashMode } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import * as Haptics from 'expo-haptics';

interface CustomCameraModalProps {
  visible: boolean;
  onClose: () => void;
  onPhotoTaken: (photoUri: string) => void;
}

export const CustomCameraModal: React.FC<CustomCameraModalProps> = ({
  visible,
  onClose,
  onPhotoTaken,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    return (
      <Modal animationType="slide" transparent={false} visible={visible} onRequestClose={onClose}>
        <SafeAreaView className="flex-1 items-center justify-center bg-black">
          <Text className="mb-4 text-center font-visby text-white">
            We need your permission to show the camera
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            className="rounded-full bg-[#8BD65E] px-6 py-3"
          >
            <Text className="font-visby-bold text-white">Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} className="mt-8">
            <Text className="font-visby text-gray-400">Cancel</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    );
  }

  const toggleCameraFacing = () => {
    Haptics.selectionAsync();
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    Haptics.selectionAsync();
    setFlash((current) => (current === 'off' ? 'on' : 'off'));
  };

  const takePicture = async () => {
    if (cameraRef.current && !isProcessing) {
      try {
        setIsProcessing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: false,
        });
        if (photo?.uri) {
          setCapturedImage(photo.uri);
        }
      } catch (error) {
        console.error('Failed to take picture:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onPhotoTaken(capturedImage);
      setCapturedImage(null);
      // Close handled by parent often, but we should reset state
    }
  };

  const retakePhoto = () => {
    Haptics.selectionAsync();
    setCapturedImage(null);
  };

  return (
    <Modal animationType="slide" transparent={false} visible={visible} onRequestClose={onClose}>
      <View className="flex-1 bg-black">
        {capturedImage ? (
          // PREVIEW SCREEN
          <View className="flex-1">
            <ExpoImage source={{ uri: capturedImage }} style={{ flex: 1 }} contentFit="contain" />

            {/* Overlay Controls */}
            <View className="absolute bottom-0 left-0 right-0 flex-row items-center justify-between bg-black/50 p-8 pb-12 backdrop-blur-md">
              <TouchableOpacity
                onPress={retakePhoto}
                className="h-14 w-14 items-center justify-center rounded-full bg-gray-800"
              >
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmPhoto}
                className="h-20 w-20 items-center justify-center rounded-full bg-[#8BD65E] shadow-lg shadow-green-500/50"
              >
                <Ionicons name="checkmark" size={40} color="white" />
              </TouchableOpacity>

              {/* Spacer to balance layout */}
              <View className="h-14 w-14" />
            </View>
          </View>
        ) : (
          // CAMERA SCREEN
          <View className="mt-0 flex-1 overflow-hidden rounded-3xl">
            <CameraView
              ref={cameraRef}
              style={{ flex: 1 }}
              facing={facing}
              flash={flash}
              mode="picture"
            >
              <SafeAreaView className="flex-1 justify-between">
                {/* Top Bar */}
                <View className="flex-row items-center justify-between bg-gradient-to-b from-black/60 to-transparent p-4 px-6">
                  <TouchableOpacity
                    onPress={onClose}
                    className="h-10 w-10 items-center justify-center rounded-full bg-black/20 backdrop-blur-md"
                  >
                    <Ionicons name="close" size={24} color="white" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={toggleFlash}
                    className="h-10 w-10 items-center justify-center rounded-full bg-black/20 backdrop-blur-md"
                  >
                    <Ionicons
                      name={flash === 'on' ? 'flash' : 'flash-off'}
                      size={22}
                      color={flash === 'on' ? '#FFD700' : 'white'}
                    />
                  </TouchableOpacity>
                </View>

                {/* Bottom Controls */}
                <View className="flex-row items-center justify-around bg-gradient-to-t from-black/80 to-transparent p-8 pb-12">
                  {/* Gallery Placeholder / Empty */}
                  <View className="w-12" />

                  {/* Shutter Button */}
                  <TouchableOpacity
                    onPress={takePicture}
                    disabled={isProcessing}
                    activeOpacity={0.7}
                    className="h-24 w-24 items-center justify-center rounded-full border-4 border-white"
                  >
                    <View
                      className={`h-20 w-20 rounded-full bg-[#8BD65E] ${isProcessing ? 'opacity-50' : ''}`}
                    />
                  </TouchableOpacity>

                  {/* Flip Button */}
                  <TouchableOpacity
                    onPress={toggleCameraFacing}
                    className="h-12 w-12 items-center justify-center rounded-full bg-gray-800/80 backdrop-blur-md"
                  >
                    <Ionicons name="camera-reverse" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </CameraView>
          </View>
        )}
      </View>
    </Modal>
  );
};
