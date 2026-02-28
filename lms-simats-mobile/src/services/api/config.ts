// Configuration for API endpoints and settings
import Constants from 'expo-constants';

// Auto-detect the dev machine's IP from Expo so it works on any network
const getDevBaseUrl = (): string => {
    const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
    if (debuggerHost) {
        const ip = debuggerHost.split(':')[0]; // strip the metro port
        return `http://${ip}:8000`;
    }
    return 'http://localhost:8000'; // fallback for simulators
};

export const API_CONFIG = {
    // Auto-detected from Expo — no manual IP changes needed!
    BASE_URL: __DEV__
        ? getDevBaseUrl()
        : 'https://production-url.com',

    TIMEOUTS: {
        DEFAULT: 30000,        // 30 seconds for normal requests
        UPLOAD: 120000,        // 2 minutes for file uploads
        GENERATION: 300000,    // 5 minutes for question generation (LLM is slow)

    },

    ENDPOINTS: {
        // Auth
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',

        // Subjects
        SUBJECTS: '/subjects',
        SUBJECT_DETAIL: (id: string) => `/subjects/${id}`,
        SUBJECT_MATERIALS: (id: string) => `/subjects/${id}/materials`,
        SUBJECT_TEXTBOOK: (id: string) => `/subjects/${id}/textbook`,
        SUBJECT_OBE: (id: string) => `/subjects/${id}/obe`,
        SUBJECT_COS: (id: string) => `/subjects/${id}/course-outcomes`,
        SUBJECT_LOS: (id: string) => `/subjects/${id}/learning-outcomes`,
        LO_MAP_TOPICS: (subjectId: string, loId: string) => `/subjects/${subjectId}/los/${loId}/map-topics`,
        LO_SUGGEST_TOPICS: (subjectId: string, loId: string) => `/subjects/${subjectId}/los/${loId}/suggest-topics`,

        TOPIC_MAP_OUTCOMES: (subjectId: string, topicId: string) => `/subjects/${subjectId}/topics/${topicId}/map-outcomes`,
        TOPIC_DETAIL: (subjectId: string, topicId: string) => `/subjects/${subjectId}/topics/${topicId}`,

        // Generation
        QUICK_GENERATE: (subjectId: string, topicId: string) => `/subjects/${subjectId}/topics/${topicId}/quick-generate`,
        UPLOAD_SAMPLE_QUESTIONS: (subjectId: string, topicId: string) => `/subjects/${subjectId}/topics/${topicId}/upload-questions`,
        UPLOAD_NOTES: (subjectId: string, topicId: string) => `/subjects/${subjectId}/topics/${topicId}/notes`,
        TRAIN_TOPIC: (subjectId: string, topicId: string) => `/subjects/${subjectId}/topics/${topicId}/train`,
        TOPIC_FILES: (subjectId: string, topicId: string) => `/subjects/${subjectId}/topics/${topicId}/files`,
        // Note: Check if facultyStore/generationService handles the dynamic URL or if we need to update them.
        // generationService.quickGenerate uses api.post(API_CONFIG.ENDPOINTS.QUICK_GENERATE, params)
        // If I change this to a function, I must update generationService.
        // Let's keep it consistent.

        RUBRIC_GENERATE: (rubricId: string) => `/rubrics/${rubricId}/generate-exam`,
        GENERATION_STATUS: (batchId: string) => `/rubrics/generation-status/${batchId}`,

        // Training
        // TRAIN_TOPIC moved to Generation section to avoid duplicates if needed, or just keep one.
        // It was defined above as well.
        TRAINING_STATUS: (jobId: string) => `/training/status/${jobId}`,

        // Rubrics
        RUBRICS: '/rubrics',
        RUBRIC_DETAIL: (id: string) => `/rubrics/${id}`,
        RUBRIC_LATEST_BATCH: (id: string) => `/rubrics/${id}/latest-batch`,

        // Questions
        QUESTIONS: '/questions',
        QUESTION_DETAIL: (id: string) => `/questions/${id}`,
        QUESTION_VALIDATE: (id: string) => `/questions/${id}/validate`,

        // Vetting
        VETTING_PENDING: '/vetting/pending',
        VETTING_BATCH: (batchId: string) => `/vetting/batches/${batchId}`,
        VETTING_APPROVE: (qId: string) => `/vetting/${qId}/approve`,
        VETTING_REJECT: (qId: string) => `/vetting/${qId}/reject`,
        VETTING_QUARANTINE: (qId: string) => `/vetting/${qId}/quarantine`,

        // Reports
        REPORTS_FACULTY: '/reports/faculty',
        REPORTS_VETTER: '/reports/vetter',
        REPORTS_OVERVIEW: '/reports/overview',
        REPORTS_CO_COVERAGE: (subjectId: string) => `/reports/co-coverage/${subjectId}`,
        REPORTS_BLOOMS: (subjectId: string) => `/reports/blooms-distribution/${subjectId}`,
        REPORTS_TOPIC_COVERAGE: (subjectId: string) => `/reports/topic-coverage/${subjectId}`,
        REPORTS_VETTER_STATS: '/reports/vetter-stats',
        REPORTS_BY_SUBJECT: '/reports/questions-by-subject',
    },
};
