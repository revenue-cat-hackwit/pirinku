import { useState, useRef, useEffect, useCallback } from 'react';
import { Audio } from 'expo-av';

interface UseAudioRecorderOptions {
  onSilenceDetected?: () => void;
  silenceThreshold?: number;
  silenceDuration?: number;
  maxDuration?: number; // Optional limit
  onPermissionDenied?: () => void;
}

export const useAudioRecorder = (options: UseAudioRecorderOptions = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [metering, setMetering] = useState(-160);
  const [visualizerData, setVisualizerData] = useState<number[]>(new Array(35).fill(0));

  const recordingRef = useRef<Audio.Recording | null>(null);
  const silenceTimer = useRef<NodeJS.Timeout | null>(null);
  const isSpeakingRef = useRef(false);

  // Defaults
  const SILENCE_THRESHOLD = options.silenceThreshold || -50;
  const SILENCE_DURATION = options.silenceDuration || 2000;

  useEffect(() => {
    return () => {
      stopRecording(); // Cleanup on unmount
    };
  }, []);

  const requestPermission = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      setHasPermission(perm.status === 'granted');
      return perm.status === 'granted';
    } catch (e) {
      console.error('Permission Err', e);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          options.onPermissionDenied?.();
          return;
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const onStatusUpdate = (status: Audio.RecordingStatus) => {
        if (!status.isRecording) return;

        // Metering typically comes as a float, e.g., -160 to 0.
        const curMetering = status.metering ?? -160;
        setMetering(curMetering);

        setVisualizerData((prev) => {
          const normalized = Math.max(0, (curMetering + 60) / 60);
          return [...prev.slice(1), normalized];
        });

        // Logic for Auto-Silence Detection
        if (options.onSilenceDetected) {
          if (curMetering > SILENCE_THRESHOLD) {
            isSpeakingRef.current = true;
            if (silenceTimer.current) {
              clearTimeout(silenceTimer.current);
              silenceTimer.current = null;
            }
          }

          if (isSpeakingRef.current && curMetering < SILENCE_THRESHOLD) {
            if (!silenceTimer.current) {
              silenceTimer.current = setTimeout(() => {
                options.onSilenceDetected?.();
              }, SILENCE_DURATION);
            }
          }
        }
      };

      const { recording } = await Audio.Recording.createAsync(
        {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
          isMeteringEnabled: true,
        },
        onStatusUpdate,
        100, // 100ms update interval (10fps is enough for scrolling wave)
      );

      recordingRef.current = recording;
      setIsRecording(true);
      isSpeakingRef.current = false;
      setMetering(-160);
    } catch (err) {
      console.error('Start Rec Error', err);
      setIsRecording(false);
    }
  };

  const stopRecording = async (): Promise<string | null> => {
    if (!recordingRef.current) return null;

    setIsRecording(false);
    if (silenceTimer.current) clearTimeout(silenceTimer.current);

    try {
      const status = await recordingRef.current.getStatusAsync();

      // Check if recording has valid data
      if (!status.isRecording && status.durationMillis === 0) {
        console.warn('No audio data recorded');
        recordingRef.current = null;
        return null;
      }

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      return uri;
    } catch (error) {
      console.error('Stop Rec Error', error);
      recordingRef.current = null;
      return null;
    }
  };

  const cancelRecording = async () => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {}
      recordingRef.current = null;
    }
    setIsRecording(false);
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
  };

  return {
    isRecording,
    metering,
    visualizerData,
    startRecording,
    stopRecording,
    cancelRecording,
    hasPermission,
  };
};
