import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

// Hooks & Services
import { Recipe } from '@/lib/types';
import { useAudioRecorder } from '@/lib/hooks/useAudioRecorder';
import { VoiceService } from '@/lib/services/voiceService';
import { useSettingsStore } from '@/lib/store/settingsStore';
import { VOICES, SPEEDS, EMOTIONS } from '@/lib/constants';

const { width } = Dimensions.get('window');

export default function CookingModeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Settings Hook
  const { 
    voiceId, setVoiceId, 
    voiceSpeed, setVoiceSpeed,
    voiceEmotion, setVoiceEmotion 
  } = useSettingsStore();

  const [settingsVisible, setSettingsVisible] = useState(false);

  // Recipe State
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [fontSize, setFontSize] = useState(24);
  const [isCompleted, setIsCompleted] = useState(false);

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Cooking Session State
  const [isStarted, setIsStarted] = useState(false);
  const [isVoiceModeEnabled, setIsVoiceModeEnabled] = useState(false);

  // Animation for Mic
  const micScale = useSharedValue(1);
  const currentSound = useRef<Audio.Sound | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop audio on unmount
      if (currentSound.current) {
        currentSound.current.stopAsync();
        currentSound.current.unloadAsync();
      }
    };
  }, []);

  // Sync TTS Trigger with Steps
  useEffect(() => {
    if (!isVoiceModeEnabled || !isStarted) return;

    if (isCompleted) {
      speakStep("Bon Appétit! You've completed the recipe.");
    } else if (recipe && recipe.steps[currentStepIndex]) {
      const stepText = recipe.steps[currentStepIndex].instruction;
      speakStep(`Step ${currentStepIndex + 1}. ${stepText}`);
    }
  }, [currentStepIndex, isCompleted]); 

  const playVoiceSample = async (selectedId: string) => {
    try {
      const voice = VOICES.find((v) => v.id === selectedId);
      if (!voice?.asset) return;

      if (currentSound.current) {
        await currentSound.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(voice.asset);
      currentSound.current = sound;
      await sound.playAsync();
    } catch (error) {
      console.error('Failed to play voice sample', error);
    }
  };

  // --- TTS Implementation (Backend) ---
  const speakStep = async (text: string) => {
    try {
      // 1. Pause Mic if it's currently recording to avoid hearing itself
      if (isRecording) {
        await stopRecording(); 
      }

      // Stop any current playback
      if (currentSound.current) {
        try {
            await currentSound.current.stopAsync();
            await currentSound.current.unloadAsync();
        } catch (e) {}
      }

      console.log('[CookingMode] Generating speech for:', text);
      const videoResponse = await VoiceService.generateSpeech(text, {
        voiceId: voiceId,
        speed: voiceSpeed,
        emotion: voiceEmotion,
      });

      const audioSource = videoResponse.audio;

      if (audioSource) {
        const soundUri = audioSource.startsWith('http') 
            ? { uri: audioSource } 
            : { uri: `data:audio/mp3;base64,${audioSource}` };

        console.log('[CookingMode] Playing audio from:', audioSource.startsWith('http') ? 'URL' : 'Base64');

        // Create and play sound
        const { sound } = await Audio.Sound.createAsync(
           soundUri,
           { shouldPlay: true }
        );
        currentSound.current = sound;

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
             // 2. Playback finished, restart Mic loop if enabled
             if (isVoiceModeEnabled) {
                console.log('[CookingMode] TTS Done, restarting mic...');
                // Small delay to ensure speaker echo is gone
                setTimeout(() => {
                   setIsListening(true);
                   startRecording();
                }, 300);
             }
          }
        });
      } else {
        // Fallback if no audio returned
        console.warn('No audio returned from TTS');
        if (isVoiceModeEnabled) {
           setIsListening(true);
           startRecording();
        }
      }

    } catch (e) {
      console.error('TTS Error:', e);
       // Ensure mic comes back even on error
      if (isVoiceModeEnabled) {
        setIsListening(true);
        startRecording();
      }
    }
  };

  // --- 1. SETUP AUDIO RECORDER ---
  const stopRecordingRef = useRef<() => Promise<string | null>>(async () => null);

  const handleSilenceCallback = async () => {
    console.log('[CookingMode] Silence detected, processing command...');
    const uri = await stopRecordingRef.current();
    if (uri) handleVoiceCommand(uri);
  };

  const { startRecording, stopRecording, isRecording } = useAudioRecorder({
    onSilenceDetected: handleSilenceCallback,
    silenceDuration: 1500, 
    silenceThreshold: -40,
  });

  // Sync the ref
  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  useEffect(() => {
    // Pulse animation when recording
    if (isRecording) {
      micScale.value = withRepeat(
        withTiming(1.2, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      micScale.value = withTiming(1);
    }
  }, [isRecording]);

  const micAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  }));

  // --- 2. PARSE RECIPE ---
  useEffect(() => {
    if (params.recipe) {
      try {
        const parsed = JSON.parse(params.recipe as string);
        setRecipe(parsed);
      } catch (e) {
        console.error('Failed to parse recipe', e);
      }
    }
  }, [params.recipe]); 

  // --- 3. COMMAND PROCESSOR (STT Only) ---
  const handleVoiceCommand = async (audioUri: string) => {
    try {
      setIsProcessing(true);
      setTranscript('Processing...');

      // Send to Backend (SST Only)
      const result = await VoiceService.processAudio(audioUri, { language: 'en' }, true);

      const commandText = result.transcript.toLowerCase().trim();
      console.log('[CookingMode] Command:', commandText);
      setTranscript(`"${commandText}"`);

      let actionTaken = false;

      // Simple Command Matching
      if (
        commandText.includes('next') ||
        commandText.includes('continue') ||
        commandText.includes('go')
      ) {
        handleNext();
        actionTaken = true;
      } else if (
        commandText.includes('back') ||
        commandText.includes('previous') ||
        commandText.includes('repeat')
      ) {
        handlePrev();
        actionTaken = true;
      } else if (
        commandText.includes('stop') ||
        commandText.includes('exit') ||
        commandText.includes('quit')
      ) {
        router.back();
        return; // Don't restart mic if exiting
      } else {
        // No match
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      // Continuous Listening Loop:
      if (!actionTaken && isVoiceModeEnabled) {
        setTimeout(() => startRecording(), 500); 
      }

    } catch (e) {
      console.error('Voice Command Error', e);
      setTranscript('Error');
      // Retry listening on error if mode is active
      if (isVoiceModeEnabled) setTimeout(() => startRecording(), 1000);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleListening = async () => {
    if (!isStarted) return;

    if (isVoiceModeEnabled) {
      // Turn OFF
      setIsVoiceModeEnabled(false);
      setIsListening(false);
      await stopRecording();
      
      // Stop backend audio if playing
      if (currentSound.current) {
        try {
            await currentSound.current.stopAsync();
            await currentSound.current.unloadAsync();
        } catch (e) {}
      }
      
      setTranscript('');
    } else {
      // Turn ON
      setIsVoiceModeEnabled(true);
      setIsListening(true);
      setTranscript('Listening...');
      startRecording();
    }
  };

  // --- NAVIGATION HANDLERS ---
  const currentStep = recipe?.steps[currentStepIndex];
  const totalSteps = recipe?.steps.length || 0;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setCurrentStepIndex((prev) => prev + 1);
      setTranscript('Next Step');
    } else {
      // Completed!
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsCompleted(true);
      setTranscript('Recipe Complete! 🎉');
    }
  };

  const handlePrev = () => {
    if (isCompleted) {
      // If on completion screen, go back to last step
      setIsCompleted(false);
      setCurrentStepIndex(totalSteps - 1);
    } else if (currentStepIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCurrentStepIndex((prev) => prev - 1);
      setTranscript('Previous Step');
    }
  };

  const handleStartCooking = () => {
    setIsStarted(true);
    setIsVoiceModeEnabled(true);
    
    // Start speaking the first step
    if (recipe && recipe.steps[0]) {
      const stepText = recipe.steps[0].instruction;
      speakStep(`Let's start. Step 1. ${stepText}`);
    }
  };

  if (!recipe) return <View className="flex-1 bg-gray-900" />;

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      
      {/* START OVERLAY */}
      {!isStarted && (
        <View className="absolute inset-0 z-50 items-center justify-center bg-gray-900/95 px-6">
           <View className="mb-8 h-32 w-32 items-center justify-center rounded-full bg-primary/20">
              <Ionicons name="restaurant" size={64} color="#8BD65E" />
           </View>
           <Text className="mb-2 text-center font-visby-bold text-3xl text-white">
             Ready to Cook?
           </Text>
           <Text className="mb-10 text-center font-visby text-lg text-gray-400">
             I will guide you step-by-step with voice instructions.
           </Text>
           
           <TouchableOpacity 
             onPress={handleStartCooking}
             className="w-full items-center rounded-full bg-primary py-5 shadow-lg shadow-green-900"
           >
              <Text className="font-visby-bold text-xl text-black">Start Cooking</Text>
           </TouchableOpacity>
           
           <TouchableOpacity 
             onPress={() => router.back()}
             className="mt-4 py-3"
           >
              <Text className="font-visby-bold text-gray-500">Cancel</Text>
           </TouchableOpacity>
        </View>
      )}

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity onPress={() => router.back()} className="rounded-full bg-gray-800 p-2">
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <Text className="font-visby-bold text-sm uppercase tracking-wide text-white opacity-70">
          Voice Cooking Mode
        </Text>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setSettingsVisible(true)}
            className="rounded-full bg-gray-800 p-2"
          >
            <Ionicons name="settings-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Settings Modal */}
      <Modal
        visible={settingsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="h-[75%] rounded-t-[32px] bg-white p-6 dark:bg-gray-900">
            <View className="mb-6 flex-row items-center justify-between">
              <Text className="font-visby-bold text-xl text-black dark:text-white">
                Voice Settings
              </Text>
              <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                <Ionicons name="close" size={24} color="gray" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Voice Selection */}
              <Text className="mb-3 font-visby-bold text-gray-500">Voice Assistant</Text>
              <View className="mb-6 flex-row flex-wrap gap-2">
                {VOICES.map((v) => (
                  <TouchableOpacity
                    key={v.id}
                    onPress={() => {
                      setVoiceId(v.id);
                      playVoiceSample(v.id);
                    }}
                    className={`rounded-xl border px-4 py-3 ${
                      voiceId === v.id
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                    }`}
                  >
                    <Text
                      className={`font-visby-bold ${voiceId === v.id ? 'text-primary' : 'text-gray-900 dark:text-gray-100'}`}
                    >
                      {v.name}
                    </Text>
                    <Text className="text-xs text-gray-500">{v.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Speed Selection */}
              <Text className="mb-3 font-visby-bold text-gray-500">Speaking Speed</Text>
              <View className="mb-6 flex-row gap-3">
                {SPEEDS.map((s) => (
                  <TouchableOpacity
                    key={s.value}
                    onPress={() => setVoiceSpeed(s.value)}
                    className={`flex-1 items-center justify-center rounded-xl border py-3 ${
                      voiceSpeed === s.value
                        ? 'border-primary bg-primary'
                        : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                    }`}
                  >
                    <Text
                      className={`font-visby-bold ${voiceSpeed === s.value ? 'text-black' : 'text-gray-900 dark:text-white'}`}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Emotion Selection */}
              <Text className="mb-3 font-visby-bold text-gray-500">Voice Emotion</Text>
              <View className="mb-8 flex-row flex-wrap gap-2">
                {EMOTIONS.map((e) => (
                  <TouchableOpacity
                    key={e.value}
                    onPress={() => setVoiceEmotion(e.value)}
                    className={`rounded-xl border px-4 py-3 ${
                      voiceEmotion === e.value
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                    }`}
                  >
                    <Text
                      className={`font-visby-bold ${voiceEmotion === e.value ? 'text-primary' : 'text-gray-900 dark:text-gray-100'}`}
                    >
                      {e.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Progress Bar */}
      <View className="h-2 w-full bg-gray-800">
        <View style={{ width: `${progress}%` }} className="h-full rounded-r-full bg-primary" />
      </View>

      {/* Main Content */}
      <View className="flex-1 justify-center px-8">
        {isCompleted ? (
          /* COMPLETION SCREEN */
          <View className="items-center">
            <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-primary/20">
              <Ionicons name="checkmark-circle" size={80} color="#8BD65E" />
            </View>
            <Text className="mb-2 text-center font-visby-bold text-3xl text-white">
              Bon Appétit!
            </Text>
            <Text className="mb-8 text-center font-visby text-lg text-gray-400">
              You&apos;ve completed {recipe?.title}
            </Text>

            {/* Stats */}
            <View className="mb-8 w-full rounded-2xl bg-gray-800 p-6">
              <View className="flex-row justify-around">
                <View className="items-center">
                  <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-blue-500/20">
                    <Ionicons name="time-outline" size={24} color="#3B82F6" />
                  </View>
                  <Text className="font-visby-bold text-lg text-white">
                    {recipe?.time_minutes}m
                  </Text>
                  <Text className="text-xs text-gray-500">Cook Time</Text>
                </View>
                <View className="items-center">
                  <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-orange-500/20">
                    <Ionicons name="flame-outline" size={24} color="#F97316" />
                  </View>
                  <Text className="font-visby-bold text-lg text-white">
                    {recipe?.calories_per_serving}
                  </Text>
                  <Text className="text-xs text-gray-500">Calories</Text>
                </View>
                <View className="items-center">
                  <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                    <Ionicons name="checkmark-done-outline" size={24} color="#8BD65E" />
                  </View>
                  <Text className="font-visby-bold text-lg text-white">{totalSteps}</Text>
                  <Text className="text-xs text-gray-500">Steps</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="w-full gap-3">
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-full items-center rounded-2xl bg-primary py-4 shadow-lg shadow-green-900"
              >
                <Text className="font-visby-bold text-lg text-black">Back to Recipe</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(tabs)/recipes')}
                className="w-full items-center rounded-2xl border border-gray-700 bg-gray-800 py-4"
              >
                <Text className="font-visby-bold text-lg text-white">Go to My Kitchen</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* NORMAL STEP VIEW */
          <>
            <View className="mb-6 flex-row items-center">
              <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-primary">
                <Text className="font-visby-bold text-xl text-black">{currentStep?.step}</Text>
              </View>
              <Text className="font-visby text-lg text-gray-400">
                Step {currentStepIndex + 1} of {totalSteps}
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text
                style={{ fontSize: fontSize, lineHeight: fontSize * 1.5 }}
                className="text-left font-visby-bold text-white"
              >
                {currentStep?.instruction}
              </Text>
            </ScrollView>

            {/* Transcript Overlay */}
            <View className="h-10 items-center justify-center">
              {transcript ? (
                <Text className="font-visby text-sm text-green-400">{transcript}</Text>
              ) : null}
            </View>
          </>
        )}
      </View>

      {/* Controls */}
      {!isCompleted && (
        <View className="px-6 pb-8">
          {/* Mic / Listen Button */}
          <View className="mb-8 items-center">
            <TouchableOpacity activeOpacity={0.8} onPress={toggleListening} disabled={isProcessing}>
              <Animated.View
                style={[micAnimatedStyle]}
                className={`h-20 w-20 items-center justify-center rounded-full ${isVoiceModeEnabled ? 'bg-red-500' : 'bg-gray-700'}`}
              >
                {isProcessing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Ionicons
                    name={isVoiceModeEnabled ? 'mic' : 'mic-off'}
                    size={32}
                    color={isVoiceModeEnabled ? 'white' : '#999'}
                  />
                )}
              </Animated.View>
            </TouchableOpacity>
            <Text className="mt-3 text-xs text-gray-500">
              {isVoiceModeEnabled ? "Hands-Free On. Say 'Next'..." : 'Tap mic to start Hands-Free Cooking'}
            </Text>
          </View>

          <View className="flex-row justify-between gap-4">
            <TouchableOpacity
              onPress={handlePrev}
              disabled={currentStepIndex === 0}
              className={`flex-1 items-center justify-center rounded-2xl py-6 ${currentStepIndex === 0 ? 'bg-gray-800 opacity-50' : 'bg-gray-800'}`}
            >
              <Ionicons name="chevron-back" size={32} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNext}
              className="flex-[2] items-center justify-center rounded-2xl bg-primary py-6 shadow-lg shadow-green-900"
            >
              <Text className="font-visby-bold text-xl text-black">
                {currentStepIndex === totalSteps - 1 ? 'Finish!' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
