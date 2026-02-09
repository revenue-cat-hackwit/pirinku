import apiClient from './apiClient';
import { ProfileResponse, UpdateProfileRequest, UpdateProfileResponse, UploadResponse, FollowersResponse, FollowingResponse, OtherUserProfileResponse } from '@/lib/types/auth';

export const ProfileService = {
    /**
     * Get current user profile
     * GET /api/profile
     * Requires Authorization header with Bearer token
     */
    async getProfile(): Promise<ProfileResponse> {
        const response = await apiClient.get<ProfileResponse>('/api/profile');
        return response.data;
    },

    /**
     * Update user profile
     * PATCH /api/profile
     * Requires Authorization header with Bearer token
     */
    async updateProfile(data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
        const response = await apiClient.patch<UpdateProfileResponse>('/api/profile', data);
        return response.data;
    },

    /**
     * Upload file (avatar, images, etc)
     * POST /api/upload
     * Requires Authorization header with Bearer token
     * Content-Type: multipart/form-data
     */
    async uploadFile(file: FormData): Promise<UploadResponse> {
        const response = await apiClient.post<UploadResponse>('/api/upload', file, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Get followers
     * GET /api/profile/followers
     * Requires Authorization header with Bearer token
     */
    async getFollowers(): Promise<FollowersResponse> {
        const response = await apiClient.get<FollowersResponse>('/api/profile/followers');
        return response.data;
    },

    /**
     * Get following
     * GET /api/profile/following
     * Requires Authorization header with Bearer token
     */
    async getFollowing(): Promise<FollowingResponse> {
        const response = await apiClient.get<FollowingResponse>('/api/profile/following');
        return response.data;
    },

    /**
     * Toggle follow/unfollow a user
     * POST /api/users/:id/follow
     * Requires Authorization header with Bearer token
     */
    async toggleFollow(userId: string): Promise<{ success: boolean; message: string }> {
        const response = await apiClient.post<{ success: boolean; message: string }>(
            `/api/users/${userId}/follow`
        );
        return response.data;
    },

    /**
     * Get other user profile
     * GET /api/profile/other-user-profile
     * Requires Authorization header with Bearer token
     */
    async getOtherUserProfile(userId: string): Promise<OtherUserProfileResponse> {
        const response = await apiClient.get<OtherUserProfileResponse>(
            `/api/profile/other-user-profile?userId=${userId}`
        );
        return response.data;
    },
};
