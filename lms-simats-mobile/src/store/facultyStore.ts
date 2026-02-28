import { create } from 'zustand';
import type { Subject, Question, Rubric } from '../types';
import { apiClient as api, API_CONFIG, APIError } from '../services/api';

interface Activity {
    id: string;
    type: 'generate' | 'rubric' | 'subject';
    description: string;
    subject?: string;
    timestamp: Date;
}

interface DashboardStats {
    activeSubjects: number;
    totalSubjects: number;
    totalQuestions: number;
    pendingReview: number;
}

interface QuickGenerateParams {
    subjectId: string;
    topicId: string;
    questionType: 'mcq' | 'short' | 'essay';
    difficulty: 'easy' | 'medium' | 'hard';
    count: number;
    coMapping?: string[];
    bloomLevel?: string;
}

interface GenerationResult {
    batchId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    questions?: Question[];
}

interface GenerationStatus {
    batchId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    result?: any;
}

interface FacultyState {
    // Data
    subjects: Subject[];
    currentSubject: Subject | null;
    questions: Question[];
    rubrics: Rubric[];
    recentActivity: Activity[];
    stats: DashboardStats;

    // Loading states
    isLoadingSubjects: boolean;
    isLoadingQuestions: boolean;
    isGenerating: boolean;
    isUploading: boolean;

    // Error states
    error: string | null;

    // Actions
    fetchDashboard: () => Promise<void>;

    // Subject actions
    fetchSubjects: () => Promise<void>;
    getSubjectById: (id: string) => Subject | null;
    fetchSubjectDetail: (id: string) => Promise<void>;
    createSubject: (data: FormData) => Promise<Subject>;
    uploadMaterials: (subjectId: string, files: FormData) => Promise<void>;
    updateSubjectOBE: (subjectId: string, data: any) => Promise<void>;
    fetchTopicDetail: (subjectId: string, topicId: string) => Promise<void>;
    uploadSampleQuestions: (
        subjectId: string,
        topicId: string,
        questionType: string,
        file: any
    ) => Promise<void>;
    downloadSampleTemplate: (type: string) => Promise<string>; // Returns URL or path
    uploadTopicNotes: (subjectId: string, topicId: string, file: any) => Promise<void>;
    updateUnit: (subjectId: string, unitId: string, title: string) => Promise<void>;
    updateTopic: (subjectId: string, topicId: string, name: string) => Promise<void>;
    createTopic: (subjectId: string, name: string) => Promise<any>;
    mapTopicOutcomes: (subjectId: string, topicId: string, coMappings: { co_id: number, weight: string }[], loIds: string[]) => Promise<void>;
    trainTopicModel: (subjectId: string, topicId: string, sampleFileIds?: string[]) => Promise<any>;
    pollTrainingStatus: (jobId: string) => Promise<any>;
    fetchTopicFiles: (subjectId: string, topicId: string) => Promise<any[]>;
    fetchTopicSampleFiles: (subjectId: string, topicId: string) => Promise<any[]>;
    deleteTopicFile: (subjectId: string, topicId: string, fileType: string, fileName: string) => Promise<void>;
    bulkMapCOTopics: (subjectId: string, coId: string, topicMappings: { topic_id: number; weight: string }[]) => Promise<void>;
    autoSuggestCOTopics: (subjectId: string, coId: string) => Promise<any>;
    bulkMapLOTopics: (subjectId: string, loId: string, topicIds: string[], weight: string) => Promise<void>;
    autoSuggestLOTopics: (subjectId: string, loId: string) => Promise<any>;

    // Generation actions
    quickGenerate: (params: QuickGenerateParams) => Promise<GenerationResult>;
    generateFromRubric: (rubricId: string) => Promise<GenerationResult>;
    pollGenerationStatus: (batchId: string) => Promise<GenerationStatus>;

    // Rubric actions
    fetchRubrics: () => Promise<void>;
    createRubric: (data: any) => Promise<Rubric>;
    updateRubric: (id: string, data: Partial<Rubric>) => Promise<void>;
    deleteRubric: (id: string) => Promise<void>;

    // Question actions
    fetchQuestions: (filters?: any) => Promise<void>;
    updateQuestion: (id: string, data: Partial<Question>) => Promise<void>;

    // Utility
    clearError: () => void;
    reset: () => void;
}

// Normalize subject data from backend to ensure arrays are never null/undefined
const normalizeSubject = (subject: any): any => {
    if (!subject) return subject;
    return {
        ...subject,
        units: (subject.units || []).map((unit: any) => ({
            ...unit,
            topics: unit.topics || [],
        })),
        topics: subject.topics || [],  // Flat topics directly on subject
        courseOutcomes: subject.courseOutcomes || subject.course_outcomes || [],
        learningOutcomes: subject.learningOutcomes || subject.learning_outcomes || [],
        totalQuestions: subject.totalQuestions || subject.total_questions || 0,
    };
};

const initialState = {
    subjects: [],
    currentSubject: null,
    questions: [],
    rubrics: [],
    recentActivity: [],
    stats: {
        activeSubjects: 0,
        totalSubjects: 0,
        totalQuestions: 0,
        pendingReview: 0,
    },
    isLoadingSubjects: false,
    isLoadingQuestions: false,
    isGenerating: false,
    isUploading: false,
    error: null,
};

export const useFacultyStore = create<FacultyState>((set, get) => ({
    ...initialState,

    fetchDashboard: async () => {
        set({ isLoadingSubjects: true, error: null });
        try {
            const statsRes = await api.get(API_CONFIG.ENDPOINTS.REPORTS_FACULTY);
            set({
                stats: statsRes.data,
                isLoadingSubjects: false,
            });
        } catch (error: any) {
            console.warn('Dashboard fetch failed', error);
            // Non-critical failures can be ignored or show toast
            set({ isLoadingSubjects: false });
        }
    },

    fetchSubjects: async () => {
        set({ isLoadingSubjects: true, error: null });
        try {
            const response = await api.get(API_CONFIG.ENDPOINTS.SUBJECTS);
            const subjects = (response.data || []).map(normalizeSubject);
            set({
                subjects,
                isLoadingSubjects: false
            });
        } catch (error: any) {
            set({
                error: error.message || 'Failed to fetch subjects',
                isLoadingSubjects: false
            });
            throw error;
        }
    },

    getSubjectById: (id: string) => {
        return get().subjects.find(s => s.id === id) || null;
    },

    fetchSubjectDetail: async (id: string) => {
        set({ isLoadingSubjects: true, error: null });
        try {
            const response = await api.get(API_CONFIG.ENDPOINTS.SUBJECT_DETAIL(id));
            const subject = normalizeSubject(response.data);
            set(state => ({
                currentSubject: subject,
                // Also update the subject in the list so list views have latest data
                subjects: state.subjects.map(s => s.id === id ? subject : s),
                isLoadingSubjects: false
            }));
        } catch (error: any) {
            set({
                error: error.message || 'Failed to fetch subject details',
                isLoadingSubjects: false
            });
            throw error;
        }
    },

    fetchTopicDetail: async (subjectId: string, topicId: string) => {
        try {
            const response = await api.get(API_CONFIG.ENDPOINTS.TOPIC_DETAIL(subjectId, topicId));
            const topicData = response.data;

            // Update the flat topics array on the subject
            set(state => {
                const updatedSubjects = state.subjects.map(s => {
                    if (s.id === subjectId) {
                        const updatedTopics = (s.topics || []).map(t => {
                            if (t.id === topicId) {
                                return {
                                    ...t,
                                    ...topicData,
                                    learningOutcomes: topicData.mapped_los || [],
                                    mappedCOs: topicData.mapped_cos || [],
                                    mappedLOs: topicData.mapped_los || []
                                };
                            }
                            return t;
                        });
                        return { ...s, topics: updatedTopics };
                    }
                    return s;
                });

                // Also update currentSubject if it matches
                const updatedCurrent = state.currentSubject?.id === subjectId
                    ? updatedSubjects.find(s => s.id === subjectId) || state.currentSubject
                    : state.currentSubject;

                return { subjects: updatedSubjects, currentSubject: updatedCurrent };
            });

        } catch (error: any) {
            console.error('Failed to fetch topic details', error);
        }
    },

    createSubject: async (data: FormData) => {
        set({ isUploading: true, error: null });
        try {
            const response = await api.post(API_CONFIG.ENDPOINTS.SUBJECTS, data, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: API_CONFIG.TIMEOUTS.UPLOAD,
            });

            // Refresh subjects list
            const newSubject = response.data;
            set(state => ({
                subjects: [...state.subjects, newSubject],
                isUploading: false
            }));

            return newSubject;
        } catch (error: any) {
            set({
                error: error.message || 'Failed to create subject',
                isUploading: false
            });
            throw error;
        }
    },

    uploadMaterials: async (subjectId: string, files: FormData) => {
        set({ isUploading: true, error: null });
        try {
            await api.post(API_CONFIG.ENDPOINTS.SUBJECT_MATERIALS(subjectId), files, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: API_CONFIG.TIMEOUTS.UPLOAD,
            });
            set({ isUploading: false });
            // Optionally refresh subject details here
            get().fetchSubjectDetail(subjectId);
        } catch (error: any) {
            set({
                error: error.message || 'Material upload failed',
                isUploading: false
            });
            throw error;
        }
    },

    updateSubjectOBE: async (subjectId: string, data: any) => {
        set({ isLoadingSubjects: true, error: null });
        try {
            await api.put(API_CONFIG.ENDPOINTS.SUBJECT_OBE(subjectId), data);
            set({ isLoadingSubjects: false });
            get().fetchSubjectDetail(subjectId);
        } catch (error: any) {
            set({
                error: error.message || 'Failed to update OBE data',
                isLoadingSubjects: false
            });
            throw error;
        }
    },

    quickGenerate: async (params: QuickGenerateParams) => {
        set({ isGenerating: true, error: null });
        try {
            const payload = {
                subject_id: parseInt(params.subjectId),
                topic_id: parseInt(params.topicId),
                question_type: params.questionType,
                count: params.count,
                difficulty: params.difficulty,
                bloom_level: params.bloomLevel
            };

            const response = await api.post(
                API_CONFIG.ENDPOINTS.QUICK_GENERATE(params.subjectId, params.topicId),
                payload, {
                timeout: API_CONFIG.TIMEOUTS.GENERATION,
            });

            // If synchronous (questions returned directly)
            // If synchronous (questions returned directly)
            let questionsData = null;
            if (Array.isArray(response.data)) {
                questionsData = response.data;
            } else if (response.data.questions && Array.isArray(response.data.questions)) {
                questionsData = response.data.questions;
            }

            if (questionsData) {
                const normalizedQuestions = questionsData.map((q: any) => ({
                    ...q,
                    questionText: q.question_text || q.questionText,
                    questionType: q.question_type || q.questionType,

                    validationScore: q.validation_score || q.validationScore,
                    rejectionReason: q.rejection_reason || q.rejectionReason
                }));

                set({ isGenerating: false });
                return {
                    status: 'completed',
                    result: response.data,
                    questions: normalizedQuestions
                };
            }

            const batchId = response.data.batchId || response.data.batch_id;

            // Poll for completion (asynchronous)
            if (batchId) {
                let status = await get().pollGenerationStatus(batchId);
                while (status.status === 'processing' || status.status === 'pending') {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    status = await get().pollGenerationStatus(batchId);
                }
                set({ isGenerating: false });
                return status.result || status;
            }

            set({ isGenerating: false });
            return response.data;
        } catch (error: any) {
            set({
                error: error.message || 'Generation failed',
                isGenerating: false
            });
            throw error;
        }
    },

    generateFromRubric: async (rubricId: string) => {
        set({ isGenerating: true, error: null });
        try {
            const response = await api.post(API_CONFIG.ENDPOINTS.RUBRIC_GENERATE(rubricId), {}, {
                timeout: API_CONFIG.TIMEOUTS.GENERATION,
            });

            const batchId = response.data.batchId;

            // Poll
            let status = await get().pollGenerationStatus(batchId);
            while (status.status === 'processing' || status.status === 'pending') {
                await new Promise(resolve => setTimeout(resolve, 2000));
                status = await get().pollGenerationStatus(batchId);
            }

            set({ isGenerating: false });
            return status.result || status;
        } catch (error: any) {
            set({
                error: error.message || 'Rubric generation failed',
                isGenerating: false
            });
            throw error;
        }
    },

    pollGenerationStatus: async (batchId: string) => {
        try {
            const response = await api.get(API_CONFIG.ENDPOINTS.GENERATION_STATUS(batchId));
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    fetchRubrics: async () => {
        set({ isLoadingSubjects: true, error: null });
        try {
            const response = await api.get(API_CONFIG.ENDPOINTS.RUBRICS);
            set({
                rubrics: response.data,
                isLoadingSubjects: false
            });
        } catch (error: any) {
            set({
                error: error.message || 'Failed to fetch rubrics',
                isLoadingSubjects: false
            });
        }
    },

    createRubric: async (data: any) => {
        set({ isLoadingSubjects: true, error: null });
        try {
            const response = await api.post(API_CONFIG.ENDPOINTS.RUBRICS, data);
            const newRubric = response.data;
            set(state => ({
                rubrics: [...state.rubrics, newRubric],
                isLoadingSubjects: false
            }));
            return newRubric;
        } catch (error: any) {
            set({
                error: error.message || 'Failed to create rubric',
                isLoadingSubjects: false
            });
            throw error;
        }
    },

    updateRubric: async (id: string, data: Partial<Rubric>) => {
        set({ isLoadingSubjects: true, error: null });
        try {
            await api.patch(API_CONFIG.ENDPOINTS.RUBRIC_DETAIL(id), data);

            set(state => ({
                rubrics: state.rubrics.map(r => r.id === id ? { ...r, ...data } : r),
                isLoadingSubjects: false
            }));
        } catch (error: any) {
            set({
                error: error.message || 'Failed to update rubric',
                isLoadingSubjects: false
            });
            throw error;
        }
    },

    deleteRubric: async (id: string) => {
        set({ isLoadingSubjects: true, error: null });
        try {
            await api.delete(API_CONFIG.ENDPOINTS.RUBRIC_DETAIL(id));
            set(state => ({
                rubrics: state.rubrics.filter(r => r.id !== id),
                isLoadingSubjects: false
            }));
        } catch (error: any) {
            set({
                error: error.message || 'Failed to delete rubric',
                isLoadingSubjects: false
            });
            throw error;
        }
    },

    fetchQuestions: async (filters?: any) => {
        set({ isLoadingQuestions: true, error: null });
        try {
            const response = await api.get(API_CONFIG.ENDPOINTS.QUESTIONS, { params: filters });
            set({
                questions: response.data,
                isLoadingQuestions: false
            });
        } catch (error: any) {
            set({
                error: error.message || 'Failed to fetch questions',
                isLoadingQuestions: false
            });
        }
    },

    updateQuestion: async (id: string, data: Partial<Question>) => {
        set({ isLoadingQuestions: true, error: null });
        try {
            await api.patch(API_CONFIG.ENDPOINTS.QUESTION_DETAIL(id), data);
            set(state => ({
                questions: state.questions.map(q => q.id === id ? { ...q, ...data } : q),
                isLoadingQuestions: false
            }));
        } catch (error: any) {
            set({
                error: error.message || 'Failed to update question',
                isLoadingQuestions: false
            });
            throw error;
        }
    },

    uploadSampleQuestions: async (subjectId: string, topicId: string, type: string, file: any) => {
        set({ isUploading: true, error: null });
        try {
            const formData = new FormData();
            formData.append('question_type', type);
            // Append file
            formData.append('file', {
                uri: file.uri,
                type: file.mimeType || 'application/pdf',
                name: file.name
            } as any);

            await api.post(
                API_CONFIG.ENDPOINTS.UPLOAD_SAMPLE_QUESTIONS(subjectId, topicId),
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    timeout: API_CONFIG.TIMEOUTS.UPLOAD,
                }
            );

            set({ isUploading: false });
            // Refresh topic details to reflect changes (though sample questions aren't shown in detail yet, usually)
            // But if we want to show a count, we should refresh
            get().fetchTopicDetail(subjectId, topicId);
        } catch (error: any) {
            set({
                error: error.message || 'Sample questions upload failed',
                isUploading: false
            });
            throw error;
        }
    },

    uploadTopicNotes: async (subjectId: string, topicId: string, file: any) => {
        set({ isUploading: true, error: null });
        try {
            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                name: file.name,
                type: file.mimeType || 'application/pdf', // Ensure valid mime type
            } as any);

            await api.post(API_CONFIG.ENDPOINTS.UPLOAD_NOTES(subjectId, topicId), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: API_CONFIG.TIMEOUTS.UPLOAD || 120000,
            });

            await get().fetchTopicDetail(subjectId, topicId);
            set({ isUploading: false });
        } catch (error: any) {
            set({
                isUploading: false,
                error: error.message || 'Failed to upload notes',
            });
            throw error;
        }
    },

    downloadSampleTemplate: async (type: string) => {
        // Mock implementation returning a dummy URL
        return `https://example.com/templates/sample_questions_${type.toLowerCase()}.csv`;
    },

    updateUnit: async (subjectId, unitId, title) => {
        set({ isLoadingSubjects: true, error: null });
        try {
            await api.put(`/subjects/${subjectId}/units/${unitId}`, { title });
            // Refresh subject to show new unit title
            await get().fetchSubjectDetail(subjectId);
            set({ isLoadingSubjects: false });
        } catch (error: any) {
            set({ isLoadingSubjects: false, error: error.message });
            throw error;
        }
    },

    updateTopic: async (subjectId, topicId, name) => {
        set({ isLoadingSubjects: true, error: null });
        try {
            await api.put(`/subjects/${subjectId}/topics/${topicId}`, { name });
            // Refresh subject to show new topic name
            await get().fetchSubjectDetail(subjectId);
            set({ isLoadingSubjects: false });
        } catch (error: any) {
            set({ isLoadingSubjects: false, error: error.message });
            throw error;
        }
    },

    createTopic: async (subjectId: string, name: string) => {
        try {
            const response = await api.post(`/subjects/${subjectId}/topics`, { name });
            // Refresh subject to show new topic
            await get().fetchSubjectDetail(subjectId);
            return response.data;
        } catch (error: any) {
            throw error;
        }
    },

    mapTopicOutcomes: async (subjectId: string, topicId: string, coMappings: { co_id: number, weight: string }[], loIds: string[]) => {
        set({ isLoadingSubjects: true, error: null });
        try {
            await api.post(API_CONFIG.ENDPOINTS.TOPIC_MAP_OUTCOMES(subjectId, topicId), {
                co_mappings: coMappings,
                lo_ids: loIds
            });
            // Refresh topic details to show new mappings
            await get().fetchTopicDetail(subjectId, topicId);
            set({ isLoadingSubjects: false });
        } catch (error: any) {
            set({ isLoadingSubjects: false, error: error.message || 'Failed to map outcomes' });
            throw error;
        }
    },

    trainTopicModel: async (subjectId: string, topicId: string, sampleFileIds: string[] = []) => {
        set({ isGenerating: true, error: null });
        try {
            // Updated to use the correct endpoint structure if needed, or stick to config
            // API_CONFIG.ENDPOINTS.TRAIN_TOPIC might point to topics.py stub.
            // We want to hit training.py: /training/topics/{topic_id}/train-model
            // Let's hardcode for now or update config. 
            // Better to update config in next step if needed, but for now let's assume TRAIN_TOPIC is correct or we use direct path.
            // Actually, best to use the training endpoint directly.
            const response = await api.post(`/training/topics/${topicId}/train-model`, {
                sample_file_ids: sampleFileIds
            });
            console.log("Store trainTopicModel response type:", typeof response);
            console.log("Store trainTopicModel response keys:", Object.keys(response));
            console.log("Store trainTopicModel response status:", response.status);
            console.log("Store trainTopicModel response data:", JSON.stringify(response.data));
            return response.data; // { job_id: "..." }
        } catch (error: any) {
            set({
                error: error.message || 'Failed to start training',
                isGenerating: false
            });
            throw error;
        }
    },

    fetchTopicSampleFiles: async (subjectId: string, topicId: string) => {
        try {
            const response = await api.get(`/training/topics/${topicId}/sample-files`);
            return response.data;
        } catch (error: any) {
            console.warn("Failed to fetch sample files", error);
            return [];
        }
    },

    pollTrainingStatus: async (jobId: string) => {
        try {
            const response = await api.get(API_CONFIG.ENDPOINTS.TRAINING_STATUS(jobId));
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    fetchTopicFiles: async (subjectId: string, topicId: string) => {
        try {
            const response = await api.get(API_CONFIG.ENDPOINTS.TOPIC_FILES(subjectId, topicId));
            return response.data; // [{name, type, size, uploaded_at}, ...]
        } catch (error: any) {
            console.warn("Failed to fetch topic files", error);
            return [];
        }
    },

    deleteTopicFile: async (subjectId: string, topicId: string, fileType: string, fileName: string) => {
        try {
            await api.delete(`/subjects/${subjectId}/topics/${topicId}/files/${fileType}/${encodeURIComponent(fileName)}`);
            // Refresh topic files
            get().fetchTopicDetail(subjectId, topicId);
        } catch (error: any) {
            console.error("Failed to delete topic file", error);
            throw error;
        }
    },

    // CO Bulk Mapping Actions
    bulkMapCOTopics: async (subjectId: string, coId: string, topicMappings: { topic_id: number; weight: string }[]) => {
        set({ isLoadingSubjects: true, error: null });
        try {
            await api.post(`/subjects/${subjectId}/cos/${coId}/map-topics`, {
                topic_mappings: topicMappings
            });
            // Refresh subject to show new mappings
            await get().fetchSubjectDetail(subjectId);
            set({ isLoadingSubjects: false });
        } catch (error: any) {
            set({ isLoadingSubjects: false, error: error.message || 'Failed to map topics' });
            throw error;
        }
    },

    autoSuggestCOTopics: async (subjectId: string, coId: string) => {
        try {
            const response = await api.get(`/subjects/${subjectId}/cos/${coId}/suggest-topics`);
            return response.data; // { topic_ids: [], reasoning: "" }
        } catch (error: any) {
            console.warn("Auto-suggest failed", error);
            throw error;
        }
    },

    // LO Mapping Actions
    bulkMapLOTopics: async (subjectId: string, loId: string, topicIds: string[], weight: string) => {
        set({ isLoadingSubjects: true, error: null });
        try {
            await api.post(API_CONFIG.ENDPOINTS.LO_MAP_TOPICS(subjectId, loId), {
                topic_ids: topicIds.map(id => parseInt(id)),
                weight
            });
            // Refresh subject to show new mappings
            await get().fetchSubjectDetail(subjectId);
            set({ isLoadingSubjects: false });
        } catch (error: any) {
            set({ isLoadingSubjects: false, error: error.message || 'Failed to map topics' });
            throw error;
        }
    },

    autoSuggestLOTopics: async (subjectId: string, loId: string) => {
        try {
            const response = await api.get(API_CONFIG.ENDPOINTS.LO_SUGGEST_TOPICS(subjectId, loId));
            return response.data; // { topic_ids: [], reasoning: "" }
        } catch (error: any) {
            console.warn("LO auto-suggest failed", error);
            throw error;
        }
    },

    clearError: () => {
        set({ error: null });
    },

    reset: () => {
        set(initialState);
    },
}));
