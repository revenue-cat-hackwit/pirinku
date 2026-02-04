import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { CloseCircle, AddCircle, Messages2, Message } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { formatDistanceToNow } from 'date-fns';

interface ChatSession {
  id: string;
  title: string;
  lastMessage?: string;
  timestamp: number;
  messageCount?: number;
}

interface ChatHistoryDrawerProps {
  visible: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  onSelectSession: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  onNewChat: () => void;
  loading?: boolean;
}

export const ChatHistoryDrawer: React.FC<ChatHistoryDrawerProps> = ({
  visible,
  onClose,
  sessions,
  onSelectSession,
  onDeleteSession,
  onNewChat,
  loading = false,
}) => {
  const formatTime = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 flex-row">
        {/* Sidebar */}
        <View
          className={`h-full w-[280px] bg-white transition-all duration-500 ease-out ${
            visible ? 'translate-x-0' : '-translate-x-full'
          }`}
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <View className="border-b border-gray-200 bg-gradient-to-r from-green-50 to-white px-5 pb-4 pt-12">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="font-visby-bold text-xl text-gray-900">Chat History</Text>
              <TouchableOpacity onPress={onClose} className="rounded-full bg-gray-100 p-2">
                <CloseCircle size={20} color="#666" variant="Outline" />
              </TouchableOpacity>
            </View>

            {/* New Chat Button */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onNewChat();
              }}
              className="flex-row items-center justify-center gap-2 rounded-xl bg-green-500 py-3"
            >
              <AddCircle size={20} color="white" variant="Bold" />
              <Text className="font-visby-bold text-sm text-white">New Chat</Text>
            </TouchableOpacity>
          </View>

          {/* Sessions List */}
          <ScrollView className="flex-1 px-3 py-2">
            {loading ? (
              <View className="items-center justify-center py-12">
                <ActivityIndicator size="large" color="#8BD65E" />
                <Text className="mt-3 font-visby text-sm text-gray-400">Loading chats...</Text>
              </View>
            ) : sessions.length === 0 ? (
              <View className="items-center justify-center py-12">
                <Messages2 size={48} color="#D1D5DB" variant="Outline" />
                <Text className="mt-3 font-visby text-sm text-gray-400">No chat history</Text>
                <Text className="mt-1 font-visby text-xs text-gray-300">
                  Start a new conversation
                </Text>
              </View>
            ) : (
              sessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  className="mb-2 rounded-xl bg-gray-50 p-3"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onSelectSession(session.id);
                    onClose();
                  }}
                >
                  <View className="mb-1 flex-row items-start justify-between">
                    <Text
                      className="flex-1 font-visby-bold text-sm text-gray-900"
                      numberOfLines={2}
                    >
                      {session.title}
                    </Text>
                    <Text className="ml-2 font-visby text-xs text-gray-400">
                      {formatTime(session.timestamp)}
                    </Text>
                  </View>
                  {session.lastMessage && (
                    <Text className="font-visby text-xs text-gray-500" numberOfLines={2}>
                      {session.lastMessage}
                    </Text>
                  )}
                  {session.messageCount !== undefined && (
                    <View className="mt-2 flex-row items-center gap-1">
                      <Message size={12} color="#9CA3AF" variant="Outline" />
                      <Text className="font-visby text-xs text-gray-400">
                        {session.messageCount} messages
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* Footer Separator */}
          <View className="border-t border-gray-200 bg-gray-50 px-5 py-3">
            <Text className="text-center font-visby text-xs text-gray-500">
              Clear history from Settings
            </Text>
          </View>
        </View>

        {/* Backdrop - slides with sidebar */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          className={`flex-1 bg-black/50 transition-opacity duration-500 ease-out ${
            visible ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </View>
    </Modal>
  );
};
