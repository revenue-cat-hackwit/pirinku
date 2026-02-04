import apiClient from './apiClient';

export const UploadService = {
    /**
     * Upload a file
     * POST /api/upload
     * Requires Authorization header with Bearer token
     * Content-Type: multipart/form-data
     */
    async uploadFile(file: { uri: string; name: string; type: string }): Promise<{ success: boolean; data: { url: string } }> {
        const formData = new FormData();
        
        // Append file to FormData
        formData.append('file', {
            uri: file.uri,
            name: file.name,
            type: file.type,
        } as any);

        const response = await apiClient.post<{ success: boolean; data: { url: string } }>(
            '/api/upload',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        
        return response.data;
    },
};
