import { api, API_CONFIG } from './api/index';
import type { Question } from '../types';

export interface QuickGenerateParams {
    subject_id: string; // Snake case to match backend expectation if needed, or map it
    topic_id?: string;
    question_type: 'MCQ' | 'short_answer' | 'essay';
    bloom_level: string;
    difficulty: 'easy' | 'medium' | 'hard';
    count: number;
    co_id?: string;
    lo_id?: string;
}

export type GeneratedQuestion = Question; // Alias if needed

export interface GenerationResult {
    batch_id: string;
    questions: GeneratedQuestion[];
    validation_summary: {
        total: number;
        passed: number;
        failed: number;
        average_score: number;
    };
}

export type GenerationResponse = { batch_id: string };

export interface GenerationStatus {
    batch_id: string;
    status: 'queued' | 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;  // 0-100
    questions_generated: number;
    questions_validated: number;
    result?: GenerationResult;
    error?: string;
}

export const generationService = {
    quickGenerate: async (params: QuickGenerateParams): Promise<{ batch_id: string }> => {
        // Map params if backend expects specific snake_case keys
        // Assuming backend matches interface
        const response = await api.post(
            API_CONFIG.ENDPOINTS.QUICK_GENERATE(params.subject_id, params.topic_id || ''),
            params,
            { timeout: API_CONFIG.TIMEOUTS.GENERATION }
        );
        return response.data;
    },

    generateFromRubric: async (rubricId: string): Promise<{ batch_id: string }> => {
        const response = await api.post(
            API_CONFIG.ENDPOINTS.RUBRIC_GENERATE(rubricId),
            {},
            { timeout: API_CONFIG.TIMEOUTS.GENERATION }
        );
        return response.data;
    },

    getStatus: async (batchId: string): Promise<GenerationStatus> => {
        const response = await api.get(
            API_CONFIG.ENDPOINTS.GENERATION_STATUS(batchId)
        );
        return response.data;
    },

    // Polling helper
    waitForCompletion: async (
        batchId: string,
        onProgress?: (status: GenerationStatus) => void,
        pollInterval: number = 2000
    ): Promise<GenerationResult> => {
        return new Promise((resolve, reject) => {
            const poll = async () => {
                try {
                    const status = await generationService.getStatus(batchId);

                    if (onProgress) {
                        onProgress(status);
                    }

                    if (status.status === 'completed') {
                        resolve(status.result!);
                    } else if (status.status === 'failed') {
                        reject(new Error(status.error || 'Generation failed'));
                    } else {
                        setTimeout(poll, pollInterval);
                    }
                } catch (error) {
                    reject(error);
                }
            };

            poll();
        });
    },
};
