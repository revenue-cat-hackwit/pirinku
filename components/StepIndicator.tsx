import React from 'react';
import { View, Text, Animated } from 'react-native';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <View className="items-center">
      {/* Progress Text */}
      <Text className="mb-2 font-visby-bold text-xs text-gray-500">
        Step {currentStep} of {totalSteps}
      </Text>
      
      {/* Progress Bar */}
      <View className="h-2 w-48 overflow-hidden rounded-full bg-gray-200">
        <View 
          className="h-full rounded-full bg-[#8BD65E]"
          style={{ width: `${progress}%` }}
        />
      </View>
    </View>
  );
}
