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

interface FollowingModalProps {
    visible: boolean;
    onClose: () => void;
}

export const FollowingModal: React.FC<FollowingModalProps> = ({
    visible,
    onClose,
}) => {
    const [following, setFollowing] = useState<Follower[]>([]);
    const [loading, setLoading] = useState(false);
    const [unfollowingId, setUnfollowingId] = useState<string | null>(null);
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (visible) {
            fetchFollowing();
        }
    }, [visible]);

    const fetchFollowing = async () => {
        setLoading(true);
        try {
            const response = await ProfileService.getFollowing();
            setFollowing(response.data.following);
        } catch (error) {
            console.error('Error fetching following:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnfollow = async (userId: string) => {
        setUnfollowingId(userId);
        try {
            await ProfileService.toggleFollow(userId);
            // Remove user from list after successful unfollow
            setFollowing(prev => prev.filter(user => user.id !== userId));
        } catch (error) {
            console.error('Error unfollowing user:', error);
        } finally {
            setUnfollowingId(null);
        }
    };

    const handleClose = () => {
        setFollowing([]);
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
                        Following
                    </Text>
                    <View style={{ width: 24 }} />
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#8BD65E" />
                    </View>
                ) : (
                    <ScrollView className="flex-1">
                        {following.length === 0 ? (
                            <View className="items-center py-12">
                                <Ionicons name="people-outline" size={64} color="#9CA3AF" />
                                <Text className="mt-4 font-visby text-gray-500 dark:text-gray-400">
                                    Not following anyone yet
                                </Text>
                            </View>
                        ) : (
                            <View className="p-4">
                                {following.map((user) => (
                                    <View
                                        key={user.id}
                                        className="mb-3 flex-row items-center rounded-xl bg-gray-50 p-3 dark:bg-gray-900"
                                    >
                                        {/* Avatar */}
                                        <View className="h-12 w-12 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                            <Image
                                                source={{
                                                    uri:
                                                        user.avatar ||
                                                        `https://ui-avatars.com/api/?name=${user.fullName}&background=random`,
                                                }}
                                                style={{ width: 48, height: 48 }}
                                                contentFit="cover"
                                            />
                                        </View>

                                        {/* User Info */}
                                        <View className="ml-3 flex-1">
                                            <Text className="font-visby-bold text-base text-gray-900 dark:text-white">
                                                {user.fullName}
                                            </Text>
                                            <Text className="font-visby text-sm text-gray-500 dark:text-gray-400">
                                                @{user.username}
                                            </Text>
                                            {user.bio && (
                                                <Text
                                                    className="mt-1 font-visby text-xs text-gray-600 dark:text-gray-400"
                                                    numberOfLines={2}
                                                >
                                                    {user.bio}
                                                </Text>
                                            )}
                                        </View>

                                        {/* Unfollow Button */}
                                        <TouchableOpacity
                                            onPress={() => handleUnfollow(user.id)}
                                            disabled={unfollowingId === user.id}
                                            className="ml-2 rounded-lg bg-gray-200 px-4 py-2 dark:bg-gray-800"
                                        >
                                            {unfollowingId === user.id ? (
                                                <ActivityIndicator size="small" color="#8BD65E" />
                                            ) : (
                                                <Text className="font-visby-bold text-sm text-gray-700 dark:text-gray-300">
                                                    Unfollow
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
