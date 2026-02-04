import apiClient from './apiClient';

export interface ChatTitle {
    _id: string;
    userId: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

export interface ChatTitlesResponse {
    success: boolean;
    data: ChatTitle[];
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatHistory {
    _id: string;
    titleId: string;
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
    __v: number;
}

export interface ChatHistoryResponse {
    success: boolean;
    data: ChatHistory[];
}

export interface AskAndSaveResponse {
    success: boolean;
    data: {
        message: string;
        response: string;
    };
}

export const ChatService = {
    /**
     * Get chat titles/history
     * GET /api/chat/title
     * Requires Authorization header with Bearer token
     */
    async getChatTitles(): Promise<ChatTitlesResponse> {
        const response = await apiClient.get<ChatTitlesResponse>('/api/chat/title', {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    },

    /**
     * Create a new chat title
     * POST /api/chat/title
     * Requires Authorization header with Bearer token
     */
    async createChatTitle(title: string): Promise<{ success: boolean; data: ChatTitle }> {
        const response = await apiClient.post<{ success: boolean; data: ChatTitle }>(
            '/api/chat/title',
            { title },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    },

    /**
     * Get chat history by title ID
     * GET /api/chat/history?titleId={id}
     * Requires Authorization header with Bearer token
     */
    async getChatHistory(titleId: string): Promise<ChatHistoryResponse> {
        const response = await apiClient.get<ChatHistoryResponse>('/api/chat/history', {
            params: { titleId },
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    },

    /**
     * Send message and save to chat
     * POST /api/chat/ask-and-save
     * Requires Authorization header with Bearer token
     */
    async askAndSave(
        titleId: string,
        message: string,
        provider: string = 'groq'
    ): Promise<AskAndSaveResponse> {
        const response = await apiClient.post<AskAndSaveResponse>(
            '/api/chat/ask-and-save',
            {
                titleId,
                message,
                provider,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    },
};
