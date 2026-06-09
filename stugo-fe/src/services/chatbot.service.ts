import api from './api';

export const chatbotService = {
  chat: async (message: string): Promise<{ success: boolean; data?: string; message?: string }> => {
    const response = await api.post('/chatbot', { message });
    return response.data;
  }
};
