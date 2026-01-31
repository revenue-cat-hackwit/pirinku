import React from 'react';
import { View } from 'react-native';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <View className="flex-row items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, index) => {
        const step = index + 1;
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;

        return (
          <View key={step} className="flex-row items-center">
            {/* Step Circle */}
            <View
              className={`h-8 w-8 items-center justify-center rounded-full ${
                isCompleted || isCurrent ? 'bg-[#8BD65E]' : 'bg-gray-300'
              }`}
            >
              <View className="h-2 w-2 rounded-full bg-white" />
            </View>

            {/* Connector Line */}
            {step < totalSteps && (
              <View className={`h-0.5 w-16 ${isCompleted ? 'bg-[#8BD65E]' : 'bg-gray-300'}`} />
            )}
          </View>
        );
      })}
    </View>
  );
}
