import { api, API_CONFIG } from './api';

// ── Response Types ──

export interface OverviewStats {
    total_questions: number;
    approved: number;
    rejected: number;
    pending: number;
    approval_rate: number;
}

export interface COCoverageItem {
    co_code: string;
    question_count: number;
    percentage: number;
}

export interface TopicCoverageItem {
    topic_id: number;
    topic_name: string;
    count: number;
}

export interface VetterStatItem {
    vetter_id: string;
    total_reviewed: number;
    approved_count: number;
    rejected_count: number;
}

// Legacy types kept for backward compat
export interface FacultyReport {
    activeSubjects: number;
    totalSubjects: number;
    totalQuestions: number;
    pendingReview: number;
}

export interface VetterReport {
    totalReviewedThisWeek: number;
    totalReviewedThisMonth: number;
    approvalRate: number;
    averageTimePerQuestion: number;
    rejectionReasons: Record<string, number>;
}

// ── Service ──

export const reportService = {
    // ── New granular endpoints ──

    getOverview: async (subjectId?: number): Promise<OverviewStats> => {
        const params = subjectId ? { subject_id: subjectId } : {};
        const response = await api.get(API_CONFIG.ENDPOINTS.REPORTS_OVERVIEW, { params });
        return response.data;
    },

    getCOCoverage: async (subjectId: string): Promise<COCoverageItem[]> => {
        const response = await api.get(API_CONFIG.ENDPOINTS.REPORTS_CO_COVERAGE(subjectId));
        return response.data;
    },

    getBloomsDistribution: async (subjectId: string): Promise<Record<string, number>> => {
        const response = await api.get(API_CONFIG.ENDPOINTS.REPORTS_BLOOMS(subjectId));
        return response.data;
    },

    getTopicCoverage: async (subjectId: string): Promise<TopicCoverageItem[]> => {
        const response = await api.get(API_CONFIG.ENDPOINTS.REPORTS_TOPIC_COVERAGE(subjectId));
        return response.data;
    },

    getVetterStats: async (): Promise<VetterStatItem[]> => {
        const response = await api.get(API_CONFIG.ENDPOINTS.REPORTS_VETTER_STATS);
        return response.data;
    },

    getQuestionsBySubject: async (): Promise<{ subject: string; question_count: number }[]> => {
        const response = await api.get(API_CONFIG.ENDPOINTS.REPORTS_BY_SUBJECT);
        return response.data;
    },

    // ── Legacy compat (used by Dashboard & VetterStats screens) ──

    getFacultyReport: async (): Promise<FacultyReport> => {
        const response = await api.get(API_CONFIG.ENDPOINTS.REPORTS_FACULTY);
        return response.data;
    },

    getVetterReport: async (): Promise<VetterReport> => {
        const response = await api.get(API_CONFIG.ENDPOINTS.REPORTS_VETTER);
        return response.data;
    },
};
