import { api, API_CONFIG } from './api/index';
import type { Subject, CourseOutcome, LearningOutcome } from '../types';

export interface CreateSubjectInput {
    name: string;
    code: string;
    department: string;
    credits: number;
    paper_type: 'core' | 'elective';
}

export interface CreateCOInput {
    code: string;
    description: string;
}

export interface CreateLOInput {
    code: string;
    description: string;
    bloom_level?: string;
}

export const subjectService = {
    getAll: async (): Promise<Subject[]> => {
        const response = await api.get(API_CONFIG.ENDPOINTS.SUBJECTS);
        return response.data;
    },

    getById: async (id: string): Promise<Subject> => {
        const response = await api.get(API_CONFIG.ENDPOINTS.SUBJECT_DETAIL(id));
        return response.data;
    },

    createMetadata: async (data: CreateSubjectInput): Promise<Subject> => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            formData.append(key, (data as any)[key]);
        });

        const response = await api.post(
            API_CONFIG.ENDPOINTS.SUBJECTS,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return response.data;
    },

    addCourseOutcomes: async (subjectId: string, outcomes: CreateCOInput[]): Promise<void> => {
        await api.post(
            API_CONFIG.ENDPOINTS.SUBJECT_COS(subjectId),
            outcomes
        );
    },

    addLearningOutcomes: async (subjectId: string, outcomes: CreateLOInput[]): Promise<void> => {
        await api.post(
            API_CONFIG.ENDPOINTS.SUBJECT_LOS(subjectId),
            outcomes
        );
    },

    uploadSyllabus: async (subjectId: string, file: any): Promise<any> => {
        const formData = new FormData();
        formData.append('file', {
            uri: file.uri,
            type: file.type,
            name: file.name,
        } as any);

        const response = await api.post(
            API_CONFIG.ENDPOINTS.SUBJECT_TEXTBOOK(subjectId),
            formData,
            {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: API_CONFIG.TIMEOUTS.UPLOAD,
            }
        );
        return response.data;
    },

    mapTopicOutcomes: async (subjectId: string, topicId: string, coIds: number[], loIds: number[]): Promise<void> => {
        await api.post(
            API_CONFIG.ENDPOINTS.TOPIC_MAP_OUTCOMES(subjectId, topicId),
            { co_ids: coIds, lo_ids: loIds }
        );
    },

    // Legacy or other methods
    uploadMaterials: async (subjectId: string, files: FormData): Promise<void> => {
        await api.post(
            API_CONFIG.ENDPOINTS.SUBJECT_MATERIALS(subjectId),
            files,
            {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: API_CONFIG.TIMEOUTS.UPLOAD,
            }
        );
    },

    updateOBE: async (subjectId: string, data: any): Promise<Subject> => {
        const response = await api.patch(
            API_CONFIG.ENDPOINTS.SUBJECT_OBE(subjectId),
            data
        );
        return response.data;
    },
};
