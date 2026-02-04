import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { VoiceService } from '@/lib/services/voiceService';
import { useSettingsStore } from '@/lib/store/settingsStore';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onPickImage: () => void;
  loading: boolean;
  disabled?: boolean;
}

export const ChatInput = ({
  value,
  onChangeText,
  onSend,
  onPickImage,
  loading,
  disabled,
}: ChatInputProps) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Visualizer State
  const [metering, setMetering] = useState(-160);
  const [visualizerBars, setVisualizerBars] = useState<number[]>(new Array(20).fill(0.2));
  const language = useSettingsStore((state) => state.language);

  // Cleanup
  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        const { Alert } = require('react-native'); // Safety import
        Alert.alert('Permission needed', 'Please allow microphone access to use voice chat.');
        return;
      }

      // Safety cleanup
      if (recording) {
        try {
          await recording.stopAndUnloadAsync();
        } catch (e) {
          // ignore
        }
        setRecording(null);
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
          isMeteringEnabled: true,
        },
        (status) => {
          if (status.isRecording && status.metering !== undefined) {
            const curMetering = status.metering || -100;
            setMetering(curMetering);

            // Update Bars
            // Normalizing -60db to 0db usually works best for speech
            const normalized = Math.max(0, (curMetering + 60) / 60);

            setVisualizerBars((prev) => {
              const newBars = [...prev.slice(1), normalized];
              return newBars;
            });
          }
        },
        100, // Update every 100ms
      );

      setRecording(newRecording);
      setIsRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.error('Failed to start recording', err);
      const { Alert } = require('react-native');
      Alert.alert('Error', 'Failed to start recording');
    }
  }

  async function stopRecordingAndSend() {
    if (!recording) return;

    setIsRecording(false);
    setIsProcessing(true);
    setVisualizerBars(new Array(20).fill(0.2)); // Reset bars
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        // Process Audio
        const res = await VoiceService.processAudio(uri, { language }, true);
        if (res && res.transcript) {
          onChangeText(res.transcript);
          // Auto-send is optional, here we just fill text so user can review
        }
      }
    } catch (error) {
      console.error('Failed to stop/process recording', error);
      const { Alert } = require('react-native');
      Alert.alert('Error', 'Failed to process audio');
    } finally {
      setIsProcessing(false);
    }
  }

  async function cancelRecording() {
    if (!recording) return;
    setIsRecording(false);
    setVisualizerBars(new Array(20).fill(0.2)); // Reset bars
    try {
      await recording.stopAndUnloadAsync();
    } catch (e) {
      // ignore
    }
    setRecording(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  // RENDER: Loading / Processing State
  if (isProcessing) {
    return (
      <View
        className="mx-4 mb-6 flex-row items-center justify-between rounded-full bg-[#1E1F20] px-4 py-3 shadow-xl"
        style={{ elevation: 10 }}
      >
        <View className="h-10 w-10 opacity-0" />
        <View className="flex-1 flex-row items-center justify-center gap-2">
          <ActivityIndicator color="#8BD65E" size="small" />
          <Text className="font-visby text-xs text-gray-400">Processing audio...</Text>
        </View>
        <View className="h-10 w-10 opacity-0" />
      </View>
    );
  }

  // RENDER: Recording State (Themed & Visualizer)
  if (isRecording) {
    return (
      <View
        className="mx-4 mb-6 flex-row items-center justify-between rounded-full bg-[#1E1F20] px-3 py-2 shadow-xl"
        style={{ elevation: 10 }}
      >
        {/* Left: Delete/Cancel */}
        <TouchableOpacity
          onPress={cancelRecording}
          className="h-10 w-10 items-center justify-center rounded-full bg-[#2A2B2C]"
        >
          <Ionicons name="trash-outline" size={20} color="#FF5A5F" />
        </TouchableOpacity>

        {/* Center: Waveform Visualizer */}
        <View className="mx-3 h-10 flex-1 flex-row items-center justify-center gap-[2px] overflow-hidden">
          {visualizerBars.map((level, i) => {
            // dynamic height based on sound level
            // min height 4, max 32
            const height = 4 + level * 36;
            return (
              <View
                key={i}
                className="w-[3px] rounded-full bg-[#8BD65E]"
                style={{
                  height: Math.min(32, height),
                  opacity: 0.6 + level * 0.4, // brighten when loud
                }}
              />
            );
          })}
        </View>

        {/* Right: Send/Done */}
        <TouchableOpacity
          onPress={stopRecordingAndSend}
          className="h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="arrow-up" size={24} color="black" />
        </TouchableOpacity>
      </View>
    );
  }

  // RENDER: Normal Input State
  return (
    <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
      <View
        style={{
          minHeight: 60,
          borderRadius: 32,
          backgroundColor: '#E8F5E9',
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Ask Cooki..."
          placeholderTextColor="#78909C"
          className="mb-1 max-h-[100px] font-visby text-base text-gray-900"
          multiline
          textAlignVertical="top"
          editable={!loading && !isProcessing}
        />

        <View
          style={{
            marginTop: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Action Left */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <TouchableOpacity
              onPress={onPickImage}
              disabled={disabled || loading}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View
                style={{
                  height: 40,
                  width: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 9999,
                  backgroundColor: 'white',
                }}
              >
                <Ionicons name="add" size={24} color="#333" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Action Right */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {/* Mic Button */}
            <TouchableOpacity
              onPress={startRecording}
              disabled={loading || value.trim().length > 0}
              style={{ opacity: value.trim().length > 0 ? 0.5 : 1 }}
            >
              <View
                style={{
                  height: 40,
                  width: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 9999,
                  backgroundColor: '#F3F4F6',
                }}
              >
                <Ionicons name="mic" size={24} color="#333" />
              </View>
            </TouchableOpacity>

            {/* Send Button */}
            <TouchableOpacity
              onPress={onSend}
              disabled={disabled || loading || value.trim().length === 0}
            >
              <View
                style={{
                  height: 40,
                  width: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 9999,
                  backgroundColor: value.trim().length > 0 ? '#8BD65E' : '#F3F4F6',
                  shadowColor: value.trim().length > 0 ? '#000' : 'transparent',
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: value.trim().length > 0 ? 2 : 0,
                }}
              >
                {loading ? (
                  <ActivityIndicator
                    size="small"
                    color={value.trim().length > 0 ? 'white' : '#9CA3AF'}
                  />
                ) : (
                  <Ionicons
                    name="arrow-up"
                    size={24}
                    color={value.trim().length > 0 ? 'white' : '#9CA3AF'}
                  />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};
