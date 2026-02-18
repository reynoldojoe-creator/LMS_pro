import type { BloomDistribution, DifficultyDistribution } from '../types';

export interface ExamSection {
    type: 'mcq' | 'short_answer' | 'essay';
    count: number;
    marksEach: number;
    choice?: string;
}

export interface ExamPreset {
    name: string;
    duration?: number;
    totalMarks?: number;
    sections?: ExamSection[];
    bloomDistribution?: BloomDistribution;
    difficultyDistribution?: DifficultyDistribution;
    coversAllUnits?: boolean;
    unitsRange?: [number, number];
    requiresManualConfig?: boolean;
}

export const examPresets: Record<string, ExamPreset> = {
    final: {
        name: 'Final Exam',
        duration: 180,
        totalMarks: 100,
        sections: [
            { type: 'mcq', count: 20, marksEach: 1 },
            { type: 'short_answer', count: 5, marksEach: 6 },
            { type: 'essay', count: 5, marksEach: 10, choice: 'answer_any_4' },
        ],
        bloomDistribution: {
            remember: 0.10,
            understand: 0.20,
            apply: 0.30,
            analyze: 0.25,
            evaluate: 0.10,
            create: 0.05,
        },
        difficultyDistribution: {
            easy: 0.20,
            medium: 0.50,
            hard: 0.30,
        },
        coversAllUnits: true,
    },
    midterm: {
        name: 'Mid-term Exam',
        duration: 90,
        totalMarks: 50,
        sections: [
            { type: 'mcq', count: 15, marksEach: 1 },
            { type: 'short_answer', count: 5, marksEach: 5 },
            { type: 'essay', count: 2, marksEach: 5 },
        ],
        bloomDistribution: {
            remember: 0.15,
            understand: 0.30,
            apply: 0.35,
            analyze: 0.20,
            evaluate: 0,
            create: 0,
        },
        difficultyDistribution: {
            easy: 0.30,
            medium: 0.50,
            hard: 0.20,
        },
        unitsRange: [1, 3],
    },
    quiz: {
        name: 'Quiz',
        duration: 30,
        totalMarks: 20,
        sections: [
            { type: 'mcq', count: 10, marksEach: 1 },
            { type: 'short_answer', count: 2, marksEach: 5 },
        ],
        bloomDistribution: {
            remember: 0.40,
            understand: 0.40,
            apply: 0.20,
            analyze: 0,
            evaluate: 0,
            create: 0,
        },
        difficultyDistribution: {
            easy: 0.40,
            medium: 0.50,
            hard: 0.10,
        },
    },
    assignment: {
        name: 'Assignment',
        requiresManualConfig: true,
    },
};
