import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import {
  View,
  FlatList,
  Animated,
  Easing,
  Text,
  Platform,
  Keyboard,
  TouchableOpacity,
  KeyboardAvoidingView,
} from 'react-native';
import { showAlert } from '@/lib/utils/globalAlert';
import { Danger, TickCircle, MagicStar, Trash, HambergerMenu, Diamonds } from 'iconsax-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Message, Recipe } from '@/lib/types';
import { AIService } from '@/lib/services/aiService';
import { ChatService } from '@/lib/services/chatService';
import { RecipeService } from '@/lib/services/recipeService';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { EmptyChat } from '@/components/chat/EmptyChat';
import { useSubscriptionStore } from '@/lib/store/subscriptionStore';
import RevenueCatUI from 'react-native-purchases-ui';
import * as Haptics from 'expo-haptics';
import { ChatHistoryDrawer } from '@/components/chat/ChatHistoryDrawer';
import { useRouter } from 'expo-router';

const dummyMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content:
      "Hi, I'm Cooki! 🍳 I'm here to help you turn those viral links into real meals. What are we cooking today?",
    timestamp: Date.now() - 300000,
  },
  {
    id: '2',
    role: 'user',
    content: 'Aku punya ayam, bawang putih, dan kecap manis',
    timestamp: Date.now() - 240000,
  },
  {
    id: '3',
    role: 'assistant',
    content:
      '🍗 **Resep Ayam Kecap Manis**\n\n**Bahan:**\n- 500g ayam potong\n- 4 siung bawang putih\n- 3 sdm kecap manis\n- Garam dan merica secukupnya\n\n**Cara Masak:**\n1. Goreng ayam hingga kecokelatan\n2. Tumis bawang putih hingga harum\n3. Masukkan ayam, tambahkan kecap manis\n4. Aduk rata, masak hingga bumbu meresap\n\nSelamat mencoba! 😋',
    timestamp: Date.now() - 180000,
  },
  {
    id: '4',
    role: 'user',
    content: 'Wah enak! Kalau mau bikin nasi goreng gimana?',
    timestamp: Date.now() - 120000,
  },
  {
    id: '5',
    role: 'assistant',
    content:
      '🍚 **Resep Nasi Goreng Sederhana**\n\n**Bahan:**\n- 2 piring nasi putih (sebaiknya nasi dingin)\n- 2 butir telur\n- 3 siung bawang putih\n- 2 sdm kecap manis\n- Garam secukupnya\n\n**Cara Masak:**\n1. Kocok telur, buat orak-arik\n2. Tumis bawang putih hingga harum\n3. Masukkan nasi, aduk rata\n4. Tambahkan kecap manis dan garam\n5. Masak hingga nasi kering dan harum\n\nTips: Gunakan api besar agar nasi tidak lembek! 🔥',
    timestamp: Date.now() - 60000,
  },
];

const ThinkingIndicator = () => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View className="p-4 pb-8 pt-2">
      <View className="mb-2 flex-row items-center">
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <MagicStar size={24} color="#8BD65E" variant="Bold" />
        </Animated.View>
      </View>
      <Text className="text-right font-visby text-xs text-gray-400">
        Cooki can make mistakes. Please double check responses.
      </Text>
    </View>
  );
};

export default function Chatbot() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  // Current chat title ID (null means new chat)
  const [currentTitleId, setCurrentTitleId] = useState<string | null>(null);

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false);
  const [chatHistoryLoading, setChatHistoryLoading] = useState(false);

  // Subscription Hooks
  const { checkCanGenerate, incrementUsage, initialize } = useSubscriptionStore();

  // Keyboard listener to scroll to bottom when keyboard shows
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  useEffect(() => {
    // Initial load: Try to get sessions first, if any, load the latest one.
    loadSessions().then((sessions) => {
      if (sessions.length > 0) {
        // Load the most recent session
        const lastSession = sessions[0];
        setCurrentTitleId(lastSession.id);
        loadHistory(lastSession.id);
      } else {
        // New user or no history, start with empty chat (titleId = null)
        setCurrentTitleId(null);
        setMessages([]);
      }
    });
    loadSavedRecipes();
  }, []);

  // Reload sessions when drawer is opened
  useEffect(() => {
    if (historyDrawerVisible) {
      loadSessions();
    }
  }, [historyDrawerVisible]);

  const loadSessions = async () => {
    setChatHistoryLoading(true);
    try {
      const response = await ChatService.getChatTitles();
      
      if (response.success && response.data) {
        // Transform API data to ChatSession format
        const sessions = response.data.map((chat) => ({
          id: chat._id,
          title: chat.title,
          lastMessage: '', // API doesn't provide this, could be enhanced
          timestamp: new Date(chat.createdAt).getTime(),
          messageCount: 0, // API doesn't provide this, could be enhanced
        }));
        
        setChatSessions(sessions);
        return sessions;
      }
      return [];
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      return [];
    } finally {
      setChatHistoryLoading(false);
    }
  };

  const loadHistory = async (titleId: string) => {
    setLoading(true);
    try {
      const response = await ChatService.getChatHistory(titleId);
      
      if (response.success && response.data && response.data.length > 0) {
        // Transform API messages to app Message format
        const chatHistory = response.data[0];
        const transformedMessages: Message[] = chatHistory.messages.map((msg, index) => ({
          id: `${titleId}-${index}`,
          role: msg.role,
          content: msg.content,
          timestamp: Date.now() - (chatHistory.messages.length - index) * 1000, // Fake timestamps
        }));
        
        setMessages(transformedMessages);
      } else {
        setMessages([]);
      }
    } catch (e) {
      console.error('Failed to load history', e);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedRecipes = async () => {
    try {
      const recipes = await RecipeService.getUserRecipes();
      setSavedRecipes(recipes);
    } catch (e) {
      console.error('Failed to load recipes:', e);
    }
  };

  const handlePresentPaywall = async () => {
    const paywallResult = await RevenueCatUI.presentPaywall();
    if (
      paywallResult === RevenueCatUI.PAYWALL_RESULT.PURCHASED ||
      paywallResult === RevenueCatUI.PAYWALL_RESULT.RESTORED
    ) {
      await initialize();
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() && !loading) return;

    // 1. CHECK QUOTA for Chat
    if (!checkCanGenerate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showAlert(
        'Daily Limit Reached 🍳',
        'You have used your free interactions for today. Upgrade to Pro for unlimited chat!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade to Pro', onPress: handlePresentPaywall },
        ],
        {
          icon: <MagicStar size={32} color="#F59E0B" variant="Bold" />,
        },
      );
      return;
    }

    const userMessageContent = inputText.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessageContent,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      let titleId = currentTitleId;
      
      // If this is the first message (no titleId), create a new title
      if (!titleId) {
        const titleResponse = await ChatService.createChatTitle(userMessageContent);
        if (titleResponse.success && titleResponse.data) {
          titleId = titleResponse.data._id;
          setCurrentTitleId(titleId);
          // Refresh session list to show new chat
          loadSessions();
        } else {
          throw new Error('Failed to create chat title');
        }
      }

      // Send message and get AI response
      const response = await ChatService.askAndSave(titleId, userMessageContent, 'groq');
      
      if (response.success && response.data) {
        // 2. Increment Usage on Success
        incrementUsage();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data.response,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (error: any) {
      console.error('[Chatbot] Error calling AI:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('Error', 'Sorry, Cooki is busy right now. Please try again later!', undefined, {
        icon: <Danger size={32} color="#EF4444" variant="Bold" />,
        type: 'destructive',
      });
      
      // Remove the user message if failed
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    // 1. CHECk QUOTA for Image Upload
    if (!checkCanGenerate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showAlert(
        'Daily Limit Reached 🍳',
        'You have used your free interactions for today. Upgrade to Pro for unlimited photo analysis!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade to Pro', onPress: handlePresentPaywall },
        ],
        {
          icon: <MagicStar size={32} color="#F59E0B" variant="Bold" />,
        },
      );
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert(
        'Permission Denied',
        'Cooki needs gallery access to see your ingredients.',
        undefined,
        {
          icon: <Danger size={32} color="#EF4444" variant="Bold" />,
          type: 'destructive',
        },
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Only Images allowed
      allowsEditing: true,
      quality: 0.7,
      base64: true, // For images
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0];

      // For images, use base64
      if (!asset.base64) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showAlert('Error', 'Failed to process image. Please try again.', undefined, {
          icon: <Danger size={32} color="#EF4444" variant="Bold" />,
          type: 'destructive',
        });
        return;
      }
      const base64 = `data:image/jpeg;base64,${asset.base64}`;
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: [
          {
            type: 'text',
            text: inputText.trim() || 'Please create a recipe from the ingredients in this image',
          },
          { type: 'image_url', image_url: { url: base64 } },
        ],
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputText('');
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Save User Msg (Image + Text) with Session ID
      AIService.saveMessage('user', userMessage.content!, currentTitleId);

      try {
        const allMessages = messages.concat(userMessage);

        const aiResponseContent = await AIService.sendMessage(allMessages);

        // 2. Increment Usage on Success
        incrementUsage();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiResponseContent,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, aiMessage]);

        // Save AI with Session ID
        AIService.saveMessage('assistant', aiResponseContent, currentTitleId);
        loadSessions();
      } catch (error: any) {
        console.error('Error analyzing image:', error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showAlert(
          'Error',
          'Failed to analyze image. Please ensure you have a stable internet connection.',
          undefined,
          {
            icon: <Danger size={32} color="#EF4444" variant="Bold" />,
            type: 'destructive',
          },
        );
      } finally {
        setLoading(false);
      }
    }
  };

  // Parse and save recipe from AI response
  const handleSaveLastRecipe = async () => {
    try {
      // Get the last assistant message
      const lastAIMessage = [...messages].reverse().find((m) => m.role === 'assistant');

      if (!lastAIMessage || typeof lastAIMessage.content !== 'string') {
        showAlert('No Recipe Found', 'No recipe found to save from the last chat.', undefined, {
          icon: <Danger size={32} color="#EF4444" variant="Bold" />,
        });
        return;
      }

      const content = lastAIMessage.content;

      // Simple parsing - look for recipe title (usually in bold or after emoji)
      const titleMatch = content.match(/(?:\*\*|🍳|🍚|🍗|🥘|🍜)\s*(.+?)(?:\*\*|\n)/);
      const title = titleMatch ? titleMatch[1].trim() : 'Recipe from Chat';

      // Extract ingredients (lines starting with -, •, or numbers)
      const ingredientsMatch = content.match(/(?:Bahan|Ingredients?):?\s*\n((?:[-•\d].*\n?)+)/i);
      const ingredients = ingredientsMatch
        ? ingredientsMatch[1]
            .split('\n')
            .filter((l) => l.trim())
            .map((l) => {
              // Remove bullet points and numbering
              const cleaned = l.replace(/^[-•\d.)\s]+/, '').trim();

              // Try to parse quantity, unit, and item
              // Pattern: "200g Chicken" or "2 cups flour" or "1/2 tsp salt"
              const match = cleaned.match(/^([\d./]+)\s*([a-zA-Z]+)?\s+(.+)$/);

              if (match) {
                return {
                  quantity: match[1],
                  unit: match[2] || 'pcs',
                  item: match[3],
                };
              }

              // If no pattern match, treat whole string as item with quantity 1
              return {
                quantity: '1',
                unit: 'pcs',
                item: cleaned,
              };
            })
        : [];

      // Extract steps
      const stepsMatch = content.match(
        /(?:Cara|Steps?|Instructions?|Langkah):?\s*\n((?:[\d].*\n?)+)/i,
      );
      const stepsText = stepsMatch ? stepsMatch[1] : '';
      const steps = stepsText
        .split('\n')
        .filter((l) => l.trim())
        .map((instruction, idx) => ({
          step: (idx + 1).toString(),
          instruction: instruction.replace(/^\d+[.)]\s*/, '').trim(),
        }));

      if (ingredients.length === 0 && steps.length === 0) {
        showAlert(
          'Parse Failed',
          'Could not detect a recipe. Ensure Cooki provided a clear format (Ingredients & Instructions).',
          undefined,
          {
            icon: <Danger size={32} color="#F59E0B" variant="Bold" />,
          },
        );
        return;
      }

      const recipe: Recipe = {
        title,
        description: `Saved from chat on ${new Date().toLocaleDateString()}`,
        ingredients,
        steps,
        time_minutes: '30',
        calories_per_serving: '0',
        servings: '2',
        difficulty: 'Medium',
        createdAt: new Date().toISOString(),
        collections: ['From Chat'],
      };

      await RecipeService.saveRecipe(recipe);
      await loadSavedRecipes(); // Refresh

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert('Saved! 📖', `Recipe "${title}" has been saved to your collection.`, undefined, {
        icon: <TickCircle size={32} color="#10B981" variant="Bold" />,
      });
    } catch (error) {
      console.error('Failed to save recipe:', error);
      showAlert('Error', 'Failed to save recipe. Please try again.', undefined, {
        icon: <Danger size={32} color="#EF4444" variant="Bold" />,
        type: 'destructive',
      });
    }
  };

  // Get recipe recommendations
  const handleGetRecommendations = () => {
    if (savedRecipes.length === 0) {
      showAlert(
        'No Saved Recipes',
        "You don't have any saved recipes yet. Save some from chat or the Generate tab!",
        undefined,
        {
          icon: <Danger size={32} color="#F59E0B" variant="Bold" />,
        },
      );
      return;
    }

    const recommendationPrompt = `Give me 3 recipe recommendations similar to or variations of my saved recipes. Keep it simple and delicious!`;
    setInputText(recommendationPrompt);
    // Auto-send
    setTimeout(() => sendMessage(), 100);
  };

  return (
    <>
      <ChatHistoryDrawer
        visible={historyDrawerVisible}
        onClose={() => setHistoryDrawerVisible(false)}
        sessions={chatSessions} // Use real sessions
        loading={chatHistoryLoading}
        onSelectSession={(id) => {
          console.log('Selected session:', id);
          setCurrentTitleId(id);
          loadHistory(id);
          setHistoryDrawerVisible(false);
        }}
        onDeleteSession={(sessionId) => {
          showAlert('Delete Chat', 'Remove this conversation?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  await AIService.deleteSession(sessionId);
                  await loadSessions();

                  // If current session is deleted, start new one
                  if (sessionId === currentTitleId) {
                    setMessages([]);
                    setCurrentTitleId(null);
                  }

                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } catch (e) {
                  showAlert('Error', 'Failed to delete chat', undefined, {
                    icon: <Danger size={32} color="#EF4444" variant="Bold" />,
                    type: 'destructive',
                  });
                }
              },
            },
          ]);
        }}
        onNewChat={() => {
          setMessages([]);
          setInputText('');
          setCurrentTitleId(null);
          setHistoryDrawerVisible(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showAlert('New Chat Started', 'Ready for a fresh conversation! 🍳', undefined, {
            icon: <TickCircle size={32} color="#10B981" variant="Bold" />,
          });
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View className="flex-1">
          {/* Header with Hamburger Menu */}
          <View className="flex-row items-center justify-between bg-white px-4 pb-3 pt-12">
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setHistoryDrawerVisible(true);
              }}
              className="rounded-full bg-gray-100 p-2"
            >
              <HambergerMenu size={24} color="#333" variant="Outline" />
            </TouchableOpacity>

            <Text className="font-visby-bold text-xl text-[#8BD65E]">Cooki</Text>

            <TouchableOpacity
              onPress={async () => {
                const paywallResult = await RevenueCatUI.presentPaywall();
                if (
                  paywallResult === RevenueCatUI.PAYWALL_RESULT.PURCHASED ||
                  paywallResult === RevenueCatUI.PAYWALL_RESULT.RESTORED
                ) {
                  await initialize();
                }
              }}
              className="flex-row items-center gap-1.5 rounded-full bg-[#8BD65E] px-4 py-2"
            >
              <Diamonds size={16} color="white" variant="Bold" />
              <Text className="font-visby-bold text-sm text-white">Pro</Text>
            </TouchableOpacity>
          </View>

          <Animated.FlatList
            ref={flatListRef}
            data={messages}
            renderItem={({ item }: { item: Message }) => (
              <ChatMessage
                message={item}
                onSaveRecipe={handleSaveLastRecipe}
                onGetIdeas={handleGetRecommendations}
              />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              padding: 16,
              paddingBottom: 100,
              backgroundColor: '#ffffff',
              flexGrow: 1,
            }}
            onScroll={Animated.event([], { useNativeDriver: false })}
            scrollEventThrottle={16}
            ListHeaderComponent={loading ? <ThinkingIndicator /> : null}
            ListEmptyComponent={
              <EmptyChat
                onSuggestionPress={(text) => {
                  setInputText(text);
                  // Trigger send after setting input text
                  setTimeout(() => sendMessage(), 100);
                }}
              />
            }
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => {
              // Auto scroll to bottom when new message
              flatListRef.current?.scrollToEnd({ animated: true });
            }}
          />

          {/* Floating Input Box at bottom of container */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'transparent',
            }}
          >
            <ChatInput
              value={inputText}
              onChangeText={setInputText}
              onSend={sendMessage}
              onPickImage={pickImage}
              loading={loading}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
