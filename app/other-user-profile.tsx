import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ProfileService } from '@/lib/services/profileService';
import { OtherUserProfile } from '@/lib/types/auth';
import { Post } from '@/lib/types/post';

export default function OtherUserProfilePage() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const userId = params.userId as string;

    const [profile, setProfile] = useState<OtherUserProfile | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [following, setFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    useEffect(() => {
        if (userId) {
            fetchProfile();
        }
    }, [userId]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const response = await ProfileService.getOtherUserProfile(userId);
            setProfile(response.data.user);
            setPosts(response.data.posts as Post[]);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        setFollowLoading(true);
        try {
            await ProfileService.toggleFollow(userId);
            setFollowing(!following);
            // Optionally refresh profile to update follower count
            await fetchProfile();
        } catch (error) {
            console.error('Error toggling follow:', error);
        } finally {
            setFollowLoading(false);
        }
    };

    const renderPostItem = ({ item }: { item: Post }) => (
        <View className="mb-3 overflow-hidden rounded-xl bg-white dark:bg-gray-900">
            {item.imageUrl && (
                <Image
                    source={{ uri: item.imageUrl }}
                    style={{ width: '100%', height: 200 }}
                    contentFit="cover"
                />
            )}
            <View className="p-3">
                <Text className="font-visby text-sm text-gray-800 dark:text-gray-200">
                    {item.content}
                </Text>
                <View className="mt-2 flex-row items-center gap-4">
                    <View className="flex-row items-center">
                        <Ionicons name="heart" size={16} color="#EF4444" />
                        <Text className="ml-1 font-visby text-xs text-gray-600 dark:text-gray-400">
                            {item.likesCount}
                        </Text>
                    </View>
                    <View className="flex-row items-center">
                        <Ionicons name="chatbubble" size={14} color="#6B7280" />
                        <Text className="ml-1 font-visby text-xs text-gray-600 dark:text-gray-400">
                            {item.commentsCount}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white dark:bg-[#0F0F0F]">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#8BD65E" />
                </View>
            </SafeAreaView>
        );
    }

    if (!profile) {
        return (
            <SafeAreaView className="flex-1 bg-white dark:bg-[#0F0F0F]">
                <View className="flex-1 items-center justify-center">
                    <Text className="font-visby text-gray-500">Profile not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#0F0F0F]">
            {/* Header */}
            <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? 'white' : 'black'} />
                </TouchableOpacity>
                <Text className="font-visby-bold text-lg text-gray-900 dark:text-white">
                    Profile
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView className="flex-1">
                {/* Profile Header */}
                <View className="items-center border-b border-gray-100 p-6 dark:border-gray-800">
                    {/* Avatar */}
                    <View className="mb-4 h-24 w-24 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <Image
                            source={{
                                uri:
                                    profile.avatar ||
                                    `https://ui-avatars.com/api/?name=${profile.fullName}&background=random`,
                            }}
                            style={{ width: 96, height: 96 }}
                            contentFit="cover"
                        />
                    </View>

                    {/* Name */}
                    <Text className="mb-1 font-visby-bold text-xl text-black dark:text-white">
                        {profile.fullName}
                    </Text>
                    <Text className="mb-4 font-visby text-sm text-gray-500 dark:text-gray-400">
                        @{profile.username}
                    </Text>

                    {/* Stats */}
                    <View className="mb-4 w-full flex-row justify-between px-8">
                        <View className="items-center">
                            <Text className="font-visby-bold text-lg text-black dark:text-white">
                                {profile.followingCount || 0}
                            </Text>
                            <Text className="font-visby text-xs text-gray-500 dark:text-gray-400">
                                Following
                            </Text>
                        </View>
                        <View className="h-8 w-[1px] bg-gray-200 dark:bg-gray-700" />
                        <View className="items-center">
                            <Text className="font-visby-bold text-lg text-black dark:text-white">
                                {profile.followersCount || 0}
                            </Text>
                            <Text className="font-visby text-xs text-gray-500 dark:text-gray-400">
                                Followers
                            </Text>
                        </View>
                        <View className="h-8 w-[1px] bg-gray-200 dark:bg-gray-700" />
                        <View className="items-center">
                            <Text className="font-visby-bold text-lg text-black dark:text-white">
                                {posts.length}
                            </Text>
                            <Text className="font-visby text-xs text-gray-500 dark:text-gray-400">Posts</Text>
                        </View>
                    </View>

                    {/* Follow Button */}
                    <TouchableOpacity
                        onPress={handleFollow}
                        disabled={followLoading}
                        className="w-full rounded-lg bg-[#8BD65E] px-6 py-3"
                    >
                        {followLoading ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Text className="text-center font-visby-bold text-base text-white">
                                {following ? 'Unfollow' : 'Follow'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Posts Section */}
                <View className="p-4">
                    <Text className="mb-3 font-visby-bold text-lg text-gray-900 dark:text-white">
                        Posts ({posts.length})
                    </Text>

                    {posts.length === 0 ? (
                        <View className="items-center py-12">
                            <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
                            <Text className="mt-4 font-visby text-gray-500 dark:text-gray-400">
                                No posts yet
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={posts}
                            renderItem={renderPostItem}
                            keyExtractor={(item) => item.id}
                            scrollEnabled={false}
                        />
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
