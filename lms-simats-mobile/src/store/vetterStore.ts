import { create } from 'zustand';
import type { VettingBatch, VetterStats, Question } from '../types';
import { apiClient as api, API_CONFIG, APIError } from '../services/api';

interface VetterState {
    pendingBatches: VettingBatch[];
    completedBatches: VettingBatch[];
    currentBatch: VettingBatch | null;
    stats: VetterStats;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchPendingBatches: () => Promise<void>;
    fetchCompletedBatches: () => Promise<void>;
    fetchStats: () => Promise<void>;
    startReview: (batchId: string) => Promise<void>;
    approveQuestion: (questionId: string, coAdjustments?: any[], loAdjustments?: any[]) => Promise<void>;
    rejectQuestion: (questionId: string, reason: string) => Promise<void>;
    quarantineQuestion: (questionId: string, notes: string) => Promise<void>;
    getBatchById: (batchId: string) => VettingBatch | undefined;
}

const mockStats: VetterStats = {
    totalReviewedThisWeek: 0,
    totalReviewedThisMonth: 0,
    approvalRate: 0,
    averageTimePerQuestion: 0,
    rejectionReasons: {},
};

export const useVetterStore = create<VetterState>((set, get) => ({
    pendingBatches: [],
    completedBatches: [],
    currentBatch: null,
    stats: mockStats,
    isLoading: false,
    error: null,

    fetchPendingBatches: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(API_CONFIG.ENDPOINTS.VETTING_PENDING);
            set({
                pendingBatches: response.data.map((batch: any) => ({
                    id: batch.id,
                    rubricId: batch.rubricId || batch.rubric_id,
                    subjectId: batch.subjectId || batch.subject_id,
                    title: batch.title || 'Untitled Batch',
                    facultyName: batch.facultyName || batch.generated_by || 'Faculty',
                    totalQuestions: batch.totalQuestions || batch.total_questions || 0,
                    reviewedQuestions: batch.reviewedQuestions || ((batch.totalQuestions || batch.total_questions || 0) - (batch.pending_count || 0)),
                    approvedCount: batch.approvedCount || batch.approved_count || 0,
                    rejectedCount: batch.rejectedCount || batch.rejected_count || 0,
                    quarantinedCount: batch.quarantinedCount || batch.quarantined_count || 0,
                    generatedAt: batch.generatedAt || batch.generated_at,
                    status: batch.status,
                    questions: [] // Populated later
                })),
                isLoading: false,
            });
        } catch (error: any) {
            set({
                error: error.message || 'Failed to fetch pending batches',
                isLoading: false
            });
            console.warn('Fetch pending batches failed', error);
        }
    },

    fetchCompletedBatches: async () => {
        set({ isLoading: true, error: null });
        try {
            // Assuming an endpoint exists for this, creating one based on pattern
            // or fitering from a general batches endpoint
            const response = await api.get('/vetting/batches?status=completed');

            const completedBatches = response.data.map((batch: any) => ({
                id: batch.id,
                rubricId: batch.rubricId || batch.rubric_id,
                subjectId: batch.subjectId || batch.subject_id,
                title: batch.title || 'Untitled Batch',
                facultyName: batch.facultyName || batch.generated_by || 'Unknown',
                totalQuestions: batch.totalQuestions || batch.total_questions || 0,
                reviewedQuestions: batch.reviewedQuestions || ((batch.totalQuestions || batch.total_questions || 0) - (batch.pending_count || 0)),
                approvedCount: batch.approvedCount || batch.approved_count || 0,
                rejectedCount: batch.rejectedCount || batch.rejected_count || 0,
                quarantinedCount: batch.quarantinedCount || batch.quarantined_count || 0,
                generatedAt: batch.generatedAt || batch.generated_at,
                status: batch.status || 'completed',
                questions: [] // Populated later if needed
            }));

            set({
                completedBatches,
                isLoading: false,
            });
        } catch (error: any) {
            // Fallback or ignore
            set({ isLoading: false });
        }
    },

    fetchStats: async () => {
        try {
            const response = await api.get(API_CONFIG.ENDPOINTS.REPORTS_VETTER);
            const data = response.data;
            set({
                stats: {
                    totalReviewedThisWeek: data.totalReviewedThisWeek ?? 0,
                    totalReviewedThisMonth: data.totalReviewedThisMonth ?? 0,
                    approvalRate: data.approvalRate ?? 0,
                    averageTimePerQuestion: data.averageTimePerQuestion ?? 0,
                    rejectionReasons: data.rejectionReasons ?? {},
                },
            });
        } catch (error) {
            console.warn('Failed to fetch vetter stats', error);
        }
    },

    startReview: async (batchId: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(API_CONFIG.ENDPOINTS.VETTING_BATCH(batchId));
            const { batch, questions } = response.data;
            const subjectCOs = response.data.subjectCOs || [];
            const subjectLOs = response.data.subjectLOs || [];

            // Normalize questions if present
            let normalizedQuestions: Question[] = [];
            if (questions && Array.isArray(questions)) {
                normalizedQuestions = questions.map((q: any) => {
                    // Same normalization logic as rubricStore
                    let cleanText = q.question_text || q.questionText;
                    let cleanOptions = q.options;
                    let cleanExplanation = q.explanation;
                    let cleanKeyPoints = q.key_points || q.keyPoints;
                    let cleanCO = q.co_mappings || q.co_id || q.mapped_co;
                    let cleanLO = q.lo_mappings || q.lo_id || q.mapped_lo;
                    let cleanBloom = q.bloom_level || q.bloomLevel;
                    let cleanDifficulty = q.difficulty;
                    let cleanType = q.question_type || q.type;
                    let cleanScore = q.validation_score || q.validationScore || 0;
                    const cleanStatus = q.status || 'pending';

                    try {
                        // 1. Double-parse JSON string if needed (some backends double-stringify)
                        if (typeof cleanOptions === 'string') {
                            try {
                                cleanOptions = JSON.parse(cleanOptions);
                            } catch {
                                cleanOptions = null;
                            }
                        }
                        if (typeof cleanOptions === 'string') {
                            try {
                                cleanOptions = JSON.parse(cleanOptions);
                            } catch {
                                cleanOptions = null;
                            }
                        }

                        // 2. Convert dict format {"A": "text"} to array format ["text1", "text2"] if desired
                        // BUT: Backend seems to return dict for keys, so let's keep it as object if possible
                        // The user said: "the backend stores options as a JSON string... which may return a dict"
                        // The QuestionCard uses Object.entries(question.options).map... so Dict is FINE.
                        // The PROBLEM was it was a STRING "{\"A\":...}" which Object.entries treats as string chars.

                        // 3. Handle complex question text with options embedded
                        if (cleanText && typeof cleanText === 'string' && cleanText.trim().startsWith('{')) {
                            const parsed = JSON.parse(cleanText);
                            if (parsed.questions && parsed.questions[0]) {
                                const innerQ = parsed.questions[0];
                                cleanText = innerQ.question_text || innerQ.questionText || cleanText;
                                cleanOptions = innerQ.options || cleanOptions;
                                cleanExplanation = innerQ.explanation || cleanExplanation;
                                cleanKeyPoints = innerQ.key_points || cleanKeyPoints;
                                cleanCO = innerQ.co_id || cleanCO;
                                cleanLO = innerQ.lo_id || cleanLO;
                                cleanBloom = innerQ.bloom_level || cleanBloom;
                                cleanDifficulty = innerQ.difficulty || cleanDifficulty;
                            }
                        }
                    } catch (e) {
                        // ignore
                    }

                    // Normalize RAG Context — preserve structured format
                    let cleanRagContext: any = null;
                    const rawRag = (q as any).ragContext || (q as any).rag_context;
                    if (rawRag && typeof rawRag === 'object' && !Array.isArray(rawRag) && rawRag.context) {
                        // New structured format: {context: [...], reasoning: "..."}
                        cleanRagContext = rawRag;
                    } else if (Array.isArray(rawRag)) {
                        cleanRagContext = rawRag;
                    } else if (typeof rawRag === 'string') {
                        try {
                            const parsed = JSON.parse(rawRag);
                            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.context) {
                                // Structured format stored as JSON string
                                cleanRagContext = parsed;
                            } else if (Array.isArray(parsed)) {
                                cleanRagContext = parsed;
                            } else if (parsed) {
                                cleanRagContext = parsed;
                            }
                        } catch {
                            if (rawRag.trim()) cleanRagContext = [rawRag];
                        }
                    }

                    return {
                        id: q.id?.toString(),
                        subjectId: q.subject_id || q.subjectId,
                        topicId: q.topic_id || q.topicId || '',
                        loId: typeof cleanLO === 'string' ? cleanLO : JSON.stringify(cleanLO),
                        coId: typeof cleanCO === 'string' ? cleanCO : JSON.stringify(cleanCO),
                        type: cleanType,
                        difficulty: cleanDifficulty || 'medium',
                        bloomLevel: cleanBloom || 'understand',
                        questionText: cleanText,
                        options: cleanOptions,
                        correctAnswer: q.correct_answer || q.correctAnswer,
                        explanation: cleanExplanation,
                        keyPoints: cleanKeyPoints,
                        status: cleanStatus,
                        createdAt: q.created_at || q.createdAt,
                        validationScore: cleanScore,
                        ragContext: cleanRagContext,
                        topicCOs: (q as any).topicCOs || [],
                        topicLOs: (q as any).topicLOs || [],
                        approvalFeedback: (q as any).approvalFeedback
                    } as Question;
                });
            }

            set({
                currentBatch: {
                    id: batch.id,
                    rubricId: batch.rubric_id,
                    subjectId: batch.subject_id,
                    title: batch.title || 'Untitled Batch',
                    facultyName: batch.generated_by || 'Unknown',
                    totalQuestions: batch.total_questions,
                    reviewedQuestions: (batch.total_questions || 0) - (batch.pending_count || 0),
                    approvedCount: batch.approved_count || 0,
                    rejectedCount: batch.rejected_count || 0,
                    quarantinedCount: batch.quarantined_count || 0,
                    generatedAt: batch.generated_at,
                    status: batch.status || 'in_progress',
                    questions: normalizedQuestions,
                    subjectCOs,
                    subjectLOs,
                },
                isLoading: false,
            });
        } catch (error: any) {
            set({
                error: error.message || 'Failed to start review',
                isLoading: false
            });
            throw error;
        }
    },

    approveQuestion: async (questionId: string, coAdjustments?: any[], loAdjustments?: any[]) => {
        // Optimistic update
        const currentBatch = get().currentBatch;
        if (!currentBatch) return;

        const previousQuestions = currentBatch.questions;
        const updatedQuestions = previousQuestions.map(q =>
            q.id === questionId ? { ...q, status: 'approved' as const } : q
        );

        set({
            currentBatch: {
                ...currentBatch,
                questions: updatedQuestions,
                reviewedQuestions: currentBatch.reviewedQuestions + 1,
                approvedCount: currentBatch.approvedCount + 1,
            }
        });

        try {
            const formData = new FormData();
            formData.append('vetter_id', 'vetter_1'); // Mock vetter ID for now
            if (coAdjustments) formData.append('co_adjustment', JSON.stringify(coAdjustments));
            if (loAdjustments) formData.append('lo_adjustment', JSON.stringify(loAdjustments));

            await api.post(API_CONFIG.ENDPOINTS.VETTING_APPROVE(questionId), formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Success, metrics update handled either by refresh or local
        } catch (error: any) {
            // Revert on failure
            set({
                currentBatch: {
                    ...currentBatch,
                    questions: previousQuestions,
                    reviewedQuestions: currentBatch.reviewedQuestions,
                    approvedCount: currentBatch.approvedCount,
                },
                error: error.message || 'Failed to approve question'
            });
            throw error;
        }
    },

    rejectQuestion: async (questionId: string, reason: string) => {
        const currentBatch = get().currentBatch;
        if (!currentBatch) return;

        const previousQuestions = currentBatch.questions;
        const updatedQuestions = previousQuestions.map(q =>
            q.id === questionId ? { ...q, status: 'rejected' as const } : q
        );

        set({
            currentBatch: {
                ...currentBatch,
                questions: updatedQuestions,
                reviewedQuestions: currentBatch.reviewedQuestions + 1,
                rejectedCount: currentBatch.rejectedCount + 1,
            }
        });

        try {
            await api.post(API_CONFIG.ENDPOINTS.VETTING_REJECT(questionId), { reason });
        } catch (error: any) {
            set({
                currentBatch: {
                    ...currentBatch,
                    questions: previousQuestions,
                    reviewedQuestions: currentBatch.reviewedQuestions,
                    rejectedCount: currentBatch.rejectedCount,
                },
                error: error.message || 'Failed to reject question'
            });
            throw error;
        }
    },

    quarantineQuestion: async (questionId: string, notes: string) => {
        const currentBatch = get().currentBatch;
        if (!currentBatch) return;

        const previousQuestions = currentBatch.questions;
        const updatedQuestions = previousQuestions.map(q =>
            q.id === questionId ? { ...q, status: 'quarantined' as const } : q
        );

        set({
            currentBatch: {
                ...currentBatch,
                questions: updatedQuestions,
                reviewedQuestions: currentBatch.reviewedQuestions + 1,
                quarantinedCount: currentBatch.quarantinedCount + 1,
            }
        });

        try {
            await api.post(API_CONFIG.ENDPOINTS.VETTING_QUARANTINE(questionId), { notes });
        } catch (error: any) {
            set({
                currentBatch: {
                    ...currentBatch,
                    questions: previousQuestions,
                    reviewedQuestions: currentBatch.reviewedQuestions,
                    quarantinedCount: currentBatch.quarantinedCount,
                },
                error: error.message || 'Failed to quarantine question'
            });
            throw error;
        }
    },

    getBatchById: (batchId: string) => {
        const allBatches = [...get().pendingBatches, ...get().completedBatches];
        return allBatches.find(b => b.id === batchId);
    },
}));

