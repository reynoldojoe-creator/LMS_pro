import { create } from 'zustand';
import type { Rubric, CreateRubricInput, Question } from '../types';
import { api, APIError, API_CONFIG } from '../services/api';

interface RubricState {
    rubrics: Rubric[];
    currentRubric: Rubric | null;
    isLoading: boolean;
    generatedQuestions: Question[]; // Store generated questions here

    // Actions
    fetchRubrics: () => Promise<void>;
    createRubric: (rubric: CreateRubricInput) => Promise<void>;
    updateRubric: (id: string, updates: Partial<Rubric>) => Promise<void>;
    deleteRubric: (id: string) => Promise<void>;
    generateFromRubric: (rubricId: string) => Promise<Question[]>; // Return questions
    getRubricById: (id: string) => Rubric | undefined;
    fetchQuestions: (rubricId: string) => Promise<void>;
    fetchLatestQuestionsForRubric: (rubricId: string) => Promise<void>;
    clearGeneratedQuestions: () => void;
}

export const useRubricStore = create<RubricState>((set, get) => ({
    rubrics: [],
    currentRubric: null,
    isLoading: false,
    generatedQuestions: [],

    fetchRubrics: async () => {
        set({ isLoading: true });
        try {
            const response = await api.get('/rubrics');
            set({ rubrics: response.data, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch rubrics:', error);
            set({ isLoading: false });
        }
    },

    createRubric: async (rubricInput: CreateRubricInput) => {
        set({ isLoading: true });
        try {
            const response = await api.post('/rubrics', rubricInput);
            const newRubric = response.data;
            set(state => ({
                rubrics: [newRubric, ...state.rubrics],
                isLoading: false,
            }));
        } catch (error) {
            console.error('Failed to create rubric:', error);
            set({ isLoading: false });
            throw error;
        }
    },

    updateRubric: async (id: string, updates: Partial<Rubric>) => {
        set(state => ({
            rubrics: state.rubrics.map(r =>
                r.id === id ? { ...r, ...updates } : r
            ),
        }));
    },

    deleteRubric: async (id: string) => {
        try {
            await api.delete(`/rubrics/${id}`);
            set(state => ({
                rubrics: state.rubrics.filter(r => r.id !== id),
            }));
        } catch (error) {
            console.error('Failed to delete rubric:', error);
        }
    },

    generateFromRubric: async (rubricId: string): Promise<Question[]> => {
        set({ isLoading: true, generatedQuestions: [] });

        const rubric = get().rubrics.find(r => r.id === rubricId);
        if (!rubric) {
            set({ isLoading: false });
            throw new Error("Rubric not found");
        }

        try {
            // 1. Trigger Generation
            const response = await api.post(API_CONFIG.ENDPOINTS.RUBRIC_GENERATE(rubricId), {}, {
                timeout: API_CONFIG.TIMEOUTS.GENERATION
            });

            const batchId = response.data.batch_id || response.data.batchId;

            // 2. Poll for Status
            return new Promise((resolve, reject) => {
                const pollInterval = setInterval(async () => {
                    try {
                        const statusRes = await api.get(API_CONFIG.ENDPOINTS.GENERATION_STATUS(batchId));
                        const status = statusRes.data;

                        if (status.status === 'completed') {
                            clearInterval(pollInterval);

                            // 3. Fetch Generated Questions
                            // The backend 'result' might contain IDs or we can fetch via batch endpoint
                            // Let's assume result has { count, question_ids }
                            // and we fetch the questions using fetchQuestions(rubricId) which uses batch endpoint

                            await get().fetchQuestions(batchId); // fetchQuestions uses /vetting/batches/{id}

                            set(state => ({
                                rubrics: state.rubrics.map(r =>
                                    r.id === rubricId
                                        ? { ...r, status: 'generated' as const, generatedAt: new Date().toISOString() }
                                        : r
                                ),
                                isLoading: false,
                            }));

                            resolve(get().generatedQuestions);
                        } else if (status.status === 'failed') {
                            clearInterval(pollInterval);
                            set({ isLoading: false });
                            reject(new Error(status.error || "Generation failed"));
                        }
                        // else continue polling
                    } catch (err) {
                        clearInterval(pollInterval);
                        set({ isLoading: false });
                        reject(err);
                    }
                }, 2000);
            });

        } catch (error: any) {
            set({ isLoading: false });
            console.error("Batch generation failed:", error);
            throw new Error(error.message || "Generation failed");
        }
    },

    getRubricById: (id: string) => {
        return get().rubrics.find(r => r.id === id);
    },

    fetchQuestions: async (rubricId: string) => {
        // This expects a BATCH ID despite the name rubricId
        const batchId = rubricId;
        set({ isLoading: true, generatedQuestions: [] });
        try {
            const response = await api.get(`/vetting/batches/${batchId}`);
            const { questions } = response.data; // Handle { batch, questions } structure

            if (questions && Array.isArray(questions)) {
                const loadedQuestions = questions.map((q: any) => {
                    // ... normalization logic (same as before) ...
                    let cleanText = q.question_text || q.questionText;
                    let cleanOptions = q.options;
                    let cleanExplanation = q.explanation;
                    let cleanKeyPoints = q.key_points || q.keyPoints;
                    let cleanCO = q.co_mappings || q.co_id || q.mapped_co;
                    let cleanLO = q.lo_mappings || q.lo_id || q.mapped_lo;
                    let cleanDifficulty = q.difficulty;
                    let cleanType = q.question_type || q.type;
                    let cleanScore = q.validation_score || q.validationScore || 0;
                    const cleanStatus = q.status || 'pending';

                    try {
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
                                cleanDifficulty = innerQ.difficulty || cleanDifficulty;
                            }
                        }
                    } catch (e) {
                        // Keep original
                    }

                    return {
                        id: q.id?.toString(),
                        subjectId: q.subject_id || q.subjectId,
                        topicId: q.topic_id || q.topicId || '',
                        loId: typeof cleanLO === 'string' ? cleanLO : JSON.stringify(cleanLO),
                        coId: typeof cleanCO === 'string' ? cleanCO : JSON.stringify(cleanCO),
                        type: cleanType,
                        difficulty: cleanDifficulty || 'medium',
                        questionText: cleanText,
                        options: cleanOptions,
                        correctAnswer: q.correct_answer || q.correctAnswer,
                        explanation: cleanExplanation,
                        keyPoints: cleanKeyPoints,
                        status: cleanStatus,
                        createdAt: q.created_at || q.createdAt,
                        validationScore: cleanScore
                    };
                });

                set({ generatedQuestions: loadedQuestions, isLoading: false });
            } else {
                set({ generatedQuestions: [], isLoading: false });
            }
        } catch (error) {
            console.error('Failed to fetch questions:', error);
            set({ isLoading: false });
        }
    },

    fetchLatestQuestionsForRubric: async (rubricId: string) => {
        set({ isLoading: true, generatedQuestions: [] });
        try {
            // First get latest batch ID
            const batchRes = await api.get(API_CONFIG.ENDPOINTS.RUBRIC_LATEST_BATCH(rubricId));
            const batchId = batchRes.data.batch_id;

            // Then fetch questions for that batch
            await get().fetchQuestions(batchId);
            set({ isLoading: false });
        } catch (error) {
            console.warn('Failed to fetch latest batch for rubric', error);
            set({ isLoading: false });
        }
    },

    clearGeneratedQuestions: () => set({ generatedQuestions: [] }),
}));
