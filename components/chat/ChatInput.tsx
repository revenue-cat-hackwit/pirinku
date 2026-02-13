import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Microphone, Add, ArrowUp, Trash, MicrophoneSlash } from 'iconsax-react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { VoiceService } from '@/lib/services/voiceService';
import { useSettingsStore } from '@/lib/store/settingsStore';
import { showAlert } from '@/lib/utils/globalAlert';
import { Danger } from 'iconsax-react-native';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;

  loading: boolean;
  disabled?: boolean;
}

export const ChatInput = React.memo(
  ({ value, onChangeText, onSend, loading, disabled }: ChatInputProps) => {
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
          showAlert(
            'Permission Needed',
            'Please allow microphone access to use voice chat.',
            undefined,
            {
              icon: <Danger size={32} color="#F59E0B" variant="Bold" />,
            },
          );
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
        showAlert('Error', 'Failed to start recording', undefined, {
          icon: <Danger size={32} color="#EF4444" variant="Bold" />,
          type: 'destructive',
        });
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

        if (!uri) {
          throw new Error('No audio URI received from recording');
        }

        console.log('[ChatInput] Processing audio from URI:', uri);

        // Process Audio
        const res = await VoiceService.processAudio(uri, { language }, true);

        console.log('[ChatInput] Voice service response:', res);

        if (res && res.transcript) {
          console.log('[ChatInput] Transcript received:', res.transcript);
          onChangeText(res.transcript);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (res && (res.silent || res.transcript === '')) {
          console.log('[ChatInput] Audio was silent');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          // Optional: Maybe show a tiny toast "Didn't catch that?" but for now just silence is fine or specific alert
          showAlert("Didn't catch that", 'Please speak a bit louder.', undefined, {
            icon: <MicrophoneSlash size={32} color="#F59E0B" variant="Bold" />,
          });
        } else {
          throw new Error('No transcript in response. Response: ' + JSON.stringify(res));
        }
      } catch (error: any) {
        console.error('[ChatInput] Failed to stop/process recording:', error);
        console.error('[ChatInput] Error details:', {
          message: error?.message,
          stack: error?.stack,
          response: error?.response,
        });

        const errorMessage = error?.message || 'Failed to process audio';
        const detailedMessage = errorMessage.includes('Voice Service Error')
          ? 'The voice processing service is not available. Please check your backend configuration.'
          : 'Failed to process audio. Please try again.';

        showAlert('Error', detailedMessage, undefined, {
          icon: <Danger size={32} color="#EF4444" variant="Bold" />,
          type: 'destructive',
        });
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
        setRecording(null);

        // Reset audio mode
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
      } catch (e) {
        console.log('Cancel recording error:', e);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    // RENDER: Loading / Processing State
    if (isProcessing) {
      return (
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 24,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: 9999,
            backgroundColor: '#1E1F20',
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <View style={{ height: 40, width: 40, opacity: 0 }} />
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <ActivityIndicator color="#8BD65E" size="small" />
            <Text style={{ fontFamily: 'VisbyRoundCF-Regular', fontSize: 12, color: '#9CA3AF' }}>
              Processing audio...
            </Text>
          </View>
          <View style={{ height: 40, width: 40, opacity: 0 }} />
        </View>
      );
    }

    // RENDER: Recording State (Themed & Visualizer)
    if (isRecording) {
      // RENDER: Recording State (Themed & Visualizer)
      if (isRecording) {
        return (
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 24,
              backgroundColor: '#1E1F20',
              borderRadius: 32,
              paddingVertical: 16,
              paddingHorizontal: 16,
            }}
          >
            <Text
              style={{
                textAlign: 'center',
                marginBottom: 12,
                fontFamily: 'VisbyRoundCF-Bold',
                fontSize: 14,
                color: '#9CA3AF', // lighter gray for inside dark card
              }}
            >
              Listening...
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {/* Left: Delete/Cancel */}
              <TouchableOpacity
                onPress={cancelRecording}
                style={{
                  height: 48,
                  width: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 9999,
                  backgroundColor: '#2A2B2C',
                }}
              >
                <Trash size={24} color="#FF5A5F" variant="Outline" />
              </TouchableOpacity>

              {/* Center: Waveform Visualizer */}
              <View
                style={{
                  marginHorizontal: 12,
                  height: 40,
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  overflow: 'hidden',
                }}
              >
                {visualizerBars.map((level, i) => {
                  // dynamic height based on sound level
                  // min height 4, max 32
                  const height = 4 + level * 36;
                  return (
                    <View
                      key={i}
                      style={{
                        width: 4,
                        borderRadius: 9999,
                        backgroundColor: '#8BD65E',
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
                style={{
                  height: 48,
                  width: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 9999,
                  backgroundColor: 'white',
                }}
              >
                <ArrowUp size={28} color="black" variant="Bold" />
              </TouchableOpacity>
            </View>
          </View>
        );
      }
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
          }}
        >
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder="Ask Cooki..."
            placeholderTextColor="#78909C"
            style={{
              marginBottom: 4,
              maxHeight: 100,
              fontFamily: 'VisbyRoundCF-Regular',
              fontSize: 16,
              color: '#111827',
            }}
            multiline
            textAlignVertical="top"
            editable={!loading && !isProcessing}
          />

          <View
            style={{
              marginTop: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            {/* Action Left - REMOVED */}

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
                  <Microphone size={24} color="#333" variant="Outline" />
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
                  }}
                >
                  {loading ? (
                    <ActivityIndicator
                      size="small"
                      color={value.trim().length > 0 ? 'white' : '#9CA3AF'}
                    />
                  ) : (
                    <ArrowUp
                      size={24}
                      color={value.trim().length > 0 ? 'white' : '#9CA3AF'}
                      variant="Bold"
                    />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  },
);

ChatInput.displayName = 'ChatInput';
