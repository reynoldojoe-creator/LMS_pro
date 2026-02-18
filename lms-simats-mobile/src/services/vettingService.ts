import { api, API_CONFIG } from './api/index';

export interface VettingResponse {
    message: string;
    success: boolean;
}

export const vettingService = {
    getPendingBatches: async () => {
        const response = await api.get(API_CONFIG.ENDPOINTS.VETTING_PENDING);
        return response.data;
    },

    getBatchQuestions: async (batchId: string) => {
        const response = await api.get(API_CONFIG.ENDPOINTS.VETTING_BATCH(batchId));
        return response.data;
    },

    approve: async (questionId: string) => {
        const response = await api.post(
            API_CONFIG.ENDPOINTS.VETTING_APPROVE(questionId)
        );
        return response.data;
    },

    reject: async (questionId: string, reason: string) => {
        const response = await api.post(
            API_CONFIG.ENDPOINTS.VETTING_REJECT(questionId),
            { reason }
        );
        return response.data;
    },

    quarantine: async (questionId: string, notes: string) => {
        const response = await api.post(
            API_CONFIG.ENDPOINTS.VETTING_QUARANTINE(questionId),
            { notes }
        );
        return response.data;
    },
};
