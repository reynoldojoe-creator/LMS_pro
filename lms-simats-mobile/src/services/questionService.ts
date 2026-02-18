import { api, API_CONFIG } from './api';
import type { Question, QuestionFilters, ValidationResult } from '../types';

export { QuestionFilters, ValidationResult };

// Define QuestionFilters if not in types yet (assuming strictly typed)
// But types/index.ts didn't have QuestionFilters invoked in previous view_file.
// I will define it here if needed or assume it's imported.
// The user requested: "questionService.ts - Question bank operations"



export const questionService = {
    getAll: async (filters?: QuestionFilters): Promise<Question[]> => {
        const response = await api.get(API_CONFIG.ENDPOINTS.QUESTIONS, { params: filters });
        return response.data;
    },

    getById: async (id: string): Promise<Question> => {
        const response = await api.get(API_CONFIG.ENDPOINTS.QUESTION_DETAIL(id));
        return response.data;
    },

    update: async (id: string, data: Partial<Question>): Promise<Question> => {
        const response = await api.patch(API_CONFIG.ENDPOINTS.QUESTION_DETAIL(id), data);
        return response.data;
    },

    validate: async (id: string): Promise<ValidationResult> => {
        const response = await api.post(API_CONFIG.ENDPOINTS.QUESTION_VALIDATE(id));
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(API_CONFIG.ENDPOINTS.QUESTION_DETAIL(id));
    },
};
