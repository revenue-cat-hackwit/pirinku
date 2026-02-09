import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { ProfileService } from '@/lib/services/profileService';
import { Follower } from '@/lib/types/auth';

interface FollowersModalProps {
    visible: boolean;
    onClose: () => void;
}

export const FollowersModal: React.FC<FollowersModalProps> = ({
    visible,
    onClose,
}) => {
    const [followers, setFollowers] = useState<Follower[]>([]);
    const [loading, setLoading] = useState(false);
    const [followingId, setFollowingId] = useState<string | null>(null);
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (visible) {
            fetchFollowers();
        }
    }, [visible]);

    const fetchFollowers = async () => {
        setLoading(true);
        try {
            const response = await ProfileService.getFollowers();
            setFollowers(response.data.followers);
        } catch (error) {
            console.error('Error fetching followers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFollowBack = async (userId: string) => {
        setFollowingId(userId);
        try {
            await ProfileService.toggleFollow(userId);
            // Optionally refresh the list or update UI
        } catch (error) {
            console.error('Error following user:', error);
        } finally {
            setFollowingId(null);
        }
    };

    const handleClose = () => {
        setFollowers([]);
        onClose();
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View className="flex-1 bg-white dark:bg-[#0F0F0F]" style={{ paddingTop: insets.top }}>
                {/* Header */}
                <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                    <TouchableOpacity onPress={handleClose}>
                        <Ionicons name="arrow-back" size={24} color={isDark ? 'white' : 'black'} />
                    </TouchableOpacity>
                    <Text className="font-visby-bold text-lg text-gray-900 dark:text-white">
                        Followers
                    </Text>
                    <View style={{ width: 24 }} />
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#8BD65E" />
                    </View>
                ) : (
                    <ScrollView className="flex-1">
                        {followers.length === 0 ? (
                            <View className="items-center py-12">
                                <Ionicons name="people-outline" size={64} color="#9CA3AF" />
                                <Text className="mt-4 font-visby text-gray-500 dark:text-gray-400">
                                    No followers yet
                                </Text>
                            </View>
                        ) : (
                            <View className="p-4">
                                {followers.map((follower) => (
                                    <View
                                        key={follower.id}
                                        className="mb-3 flex-row items-center rounded-xl bg-gray-50 p-3 dark:bg-gray-900"
                                    >
                                        {/* Avatar */}
                                        <View className="h-12 w-12 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                            <Image
                                                source={{
                                                    uri:
                                                        follower.avatar ||
                                                        `https://ui-avatars.com/api/?name=${follower.fullName}&background=random`,
                                                }}
                                                style={{ width: 48, height: 48 }}
                                                contentFit="cover"
                                            />
                                        </View>

                                        {/* User Info */}
                                        <View className="ml-3 flex-1">
                                            <Text className="font-visby-bold text-base text-gray-900 dark:text-white">
                                                {follower.fullName}
                                            </Text>
                                            <Text className="font-visby text-sm text-gray-500 dark:text-gray-400">
                                                @{follower.username}
                                            </Text>
                                            {follower.bio && (
                                                <Text
                                                    className="mt-1 font-visby text-xs text-gray-600 dark:text-gray-400"
                                                    numberOfLines={2}
                                                >
                                                    {follower.bio}
                                                </Text>
                                            )}
                                        </View>

                                        {/* Follow Back Button */}
                                        <TouchableOpacity
                                            onPress={() => handleFollowBack(follower.id)}
                                            disabled={followingId === follower.id}
                                            className="ml-2 rounded-lg bg-[#8BD65E] px-4 py-2"
                                        >
                                            {followingId === follower.id ? (
                                                <ActivityIndicator size="small" color="white" />
                                            ) : (
                                                <Text className="font-visby-bold text-sm text-white">
                                                    Follow
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </ScrollView>
                )}
            </View>
        </Modal>
    );
};
