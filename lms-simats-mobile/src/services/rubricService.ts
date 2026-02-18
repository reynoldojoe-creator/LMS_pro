import { api, API_CONFIG } from './api';
import type { Rubric, CreateRubricInput } from '../types';

export const rubricService = {
    getAll: async (): Promise<Rubric[]> => {
        const response = await api.get(API_CONFIG.ENDPOINTS.RUBRICS);
        return response.data;
    },

    getById: async (id: string): Promise<Rubric> => {
        const response = await api.get(API_CONFIG.ENDPOINTS.RUBRIC_DETAIL(id));
        return response.data;
    },

    create: async (data: any): Promise<Rubric> => {
        // Check if data is already FormData (from CreateRubricScreen)
        if (data instanceof FormData) {
            const response = await api.post(API_CONFIG.ENDPOINTS.RUBRICS, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        }

        // Fallback or if data is plain object, convert to FormData or send as JSON if backend supports it
        // Our backend explicitly uses Form(), so we must use FormData
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            const value = data[key];
            if (typeof value === 'object' && value !== null) {
                formData.append(key, JSON.stringify(value));
            } else {
                formData.append(key, String(value));
            }
        });

        const response = await api.post(API_CONFIG.ENDPOINTS.RUBRICS, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    },

    update: async (id: string, data: Partial<Rubric>): Promise<Rubric> => {
        const response = await api.patch(API_CONFIG.ENDPOINTS.RUBRIC_DETAIL(id), data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(API_CONFIG.ENDPOINTS.RUBRIC_DETAIL(id));
    },
};
