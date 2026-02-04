import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

interface CommentModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (content: string) => Promise<void>;
  postId: string;
}

export const CommentModal: React.FC<CommentModalProps> = ({
  visible,
  onClose,
  onSubmit,
  postId,
}) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const handleSubmit = async () => {
    if (!comment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(comment.trim());
      setComment('');
      onClose();
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setComment('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleClose}
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View
              className="rounded-t-3xl bg-white dark:bg-gray-900"
              style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            >
              {/* Header */}
              <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-4 dark:border-gray-800">
                <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
                  <Ionicons name="close" size={28} color={isDark ? '#9CA3AF' : '#6B7280'} />
                </TouchableOpacity>
                <Text className="font-visby-bold text-lg text-gray-900 dark:text-white">
                  Add Comment
                </Text>
                <View style={{ width: 28 }} />
              </View>

            {/* Content */}
            <View className="px-4 pt-4">
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="What's on your mind?"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                multiline
                numberOfLines={4}
                maxLength={500}
                className="min-h-[120px] rounded-2xl bg-gray-50 p-4 font-visby text-base text-gray-900 dark:bg-gray-800 dark:text-white"
                style={{ textAlignVertical: 'top' }}
                editable={!isSubmitting}
                autoFocus
              />
              <Text className="mt-2 text-right font-visby text-xs text-gray-400">
                {comment.length}/500
              </Text>
            </View>

            {/* Submit Button */}
            <View className="px-4 pt-4">
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!comment.trim() || isSubmitting}
                className={`flex-row items-center justify-center rounded-full py-4 ${
                  !comment.trim() || isSubmitting
                    ? 'bg-gray-300 dark:bg-gray-700'
                    : 'bg-[#8BC34A]'
                }`}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="chatbubble" size={20} color="white" />
                    <Text className="ml-2 font-visby-bold text-base text-white">
                      Post Comment
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
};
