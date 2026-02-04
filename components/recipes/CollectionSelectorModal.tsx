import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { Recipe } from '@/lib/types';

interface CollectionSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  recipe: Recipe | null;
  availableCollections: string[];
  onToggleCollection: (collectionName: string) => void;
  onCreateCollection: (collectionName: string) => void;
}

export const CollectionSelectorModal: React.FC<CollectionSelectorModalProps> = ({
  visible,
  onClose,
  recipe,
  availableCollections,
  onToggleCollection,
  onCreateCollection,
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleCreate = () => {
    if (!newCollectionName.trim()) return;
    onCreateCollection(newCollectionName.trim());
    setNewCollectionName('');
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <TouchableOpacity className="flex-1" onPress={onClose} activeOpacity={1} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="w-full overflow-hidden rounded-t-3xl bg-white dark:bg-[#252525]"
        >
          <View className="max-h-[85%] min-h-[50%] p-6 pb-12">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="font-visby-bold text-xl text-gray-900 dark:text-white">
                Add to Collection
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={isDark ? 'white' : 'black'} />
              </TouchableOpacity>
            </View>

            <ScrollView className="mb-2 w-full" showsVerticalScrollIndicator={false}>
              {/* Create New Collection Row (Always Top or Toggle) */}
              {!showInput ? (
                <TouchableOpacity
                  onPress={() => setShowInput(true)}
                  className="mb-3 flex-row items-center rounded-xl border-2 border-dashed border-gray-300 bg-transparent p-4 dark:border-gray-700"
                >
                  <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <Ionicons name="add" size={24} color={isDark ? 'white' : 'black'} />
                  </View>
                  <Text className="font-visby-bold text-base text-gray-500 dark:text-gray-400">
                    New Collection
                  </Text>
                </TouchableOpacity>
              ) : (
                <View className="mb-3 flex-row gap-2">
                  <TextInput
                    value={newCollectionName}
                    onChangeText={setNewCollectionName}
                    placeholder="Collection Name"
                    placeholderTextColor="#9CA3AF"
                    autoFocus
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  <TouchableOpacity
                    onPress={() => {
                      handleCreate();
                      setShowInput(false);
                    }}
                    className={`items-center justify-center rounded-xl p-4 ${newCollectionName.trim() ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-gray-700'}`}
                    disabled={!newCollectionName.trim()}
                  >
                    <Ionicons
                      name="arrow-forward"
                      size={24}
                      color={newCollectionName.trim() ? (isDark ? 'black' : 'white') : '#888'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setShowInput(false);
                      setNewCollectionName('');
                    }}
                    className="items-center justify-center rounded-xl bg-gray-200 p-4 dark:bg-gray-800"
                  >
                    <Ionicons name="close" size={24} color={isDark ? 'white' : 'black'} />
                  </TouchableOpacity>
                </View>
              )}

              <View className="my-2 h-[1px] w-full bg-gray-100 dark:bg-gray-800" />

              {/* Existing Collections */}
              {availableCollections && availableCollections.length > 0 ? (
                availableCollections.map((name) => {
                  const isSelected = (recipe?.collections || []).includes(name);
                  return (
                    <TouchableOpacity
                      key={name}
                      onPress={() => onToggleCollection(name)}
                      className="mb-3 flex-row items-center justify-between rounded-xl bg-gray-50 p-4 dark:bg-gray-800"
                    >
                      <View className="flex-row items-center">
                        <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                          <Ionicons name="folder-open" size={20} color="#F97316" />
                        </View>
                        <Text className="font-visby-bold text-base text-gray-800 dark:text-gray-200">
                          {name}
                        </Text>
                      </View>
                      {isSelected && <Ionicons name="checkmark-circle" size={24} color="#8BD65E" />}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View className="items-center justify-center py-8 opacity-50">
                  <Text className="text-center font-visby text-sm text-gray-400">
                    No collections yet
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};
