// Base types
// Base types
export type QuestionType = 'mcq' | 'short' | 'short_answer' | 'essay';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

// Subject-related types
export interface Subject {
    id: string;
    name: string;
    code: string;
    department: string;
    credits: number;
    courseOutcomes: CourseOutcome[];
    learningOutcomes?: LearningOutcome[];
    units: Unit[];
    topics?: Topic[];  // Flat topics directly on subject (no unit nesting)
    totalQuestions: number;
    createdAt: string;
}

export interface CourseOutcome {
    id: string;
    code: string;  // CO1, CO2, etc.
    description: string;
}

export interface Unit {
    id: string;
    number: number;
    title: string;
    description?: string;
    topics: Topic[];
}

export interface Topic {
    id: string;
    name: string;
    learningOutcomes: LearningOutcome[];
    mappedCOs: CourseOutcome[];
    mappedLOs: LearningOutcome[];
    questionCount: number;
    sampleQuestions?: any[];
    questions?: any[]; // Added for TopicDetailScreen
}

export interface LearningOutcome {
    id: string;
    code: string;  // LO1, LO2
    description: string;
    // mappedCOs: string[];  // Removed, mapping is on Topic
}

// Question types
export interface Question {
    id: string;
    subjectId: string;
    topicId: string;
    loId: string;
    coId: string;
    type: QuestionType;
    difficulty: DifficultyLevel;
    questionText: string;
    bloomLevel?: string; // Added to match backend
    options?: any;  // Changed to any/Record to support {"A": "text"} format
    correctAnswer?: string;  // For MCQ
    markingScheme?: string;  // For essay
    status: 'pending' | 'approved' | 'rejected' | 'quarantined';
    createdAt: string;
    validationScore?: number;
    ragContext?: any; // Structured: {context: [], reasoning: ""} or legacy string[]
    rag_context?: string[] | string;
    topicCOs?: string[];
    topicLOs?: string[];
    approvalFeedback?: string; // JSON string
}

// User types (from existing)
export interface User {
    id: string;
    regNo: string;
    name: string;
    roles: ('faculty' | 'vetter')[];
}

// Rubric types
export interface RubricSection {
    id: string;
    type: QuestionType;
    count: number;
    marksEach: number;
    difficulty?: DifficultyLevel; // Added
    choice?: string; // e.g., "answer_any_4"
}



export interface BloomDistribution {
    remember: number;
    understand: number;
    apply: number;
    analyze: number;
    evaluate: number;
    create: number;
}

export interface DifficultyDistribution {
    easy: number;
    medium: number;
    hard: number;
}

export interface CORequirement {
    coId: string;
    minQuestions: number;
}

export interface Rubric {
    id: string;
    subjectId: string;
    examType: 'final' | 'midterm' | 'quiz' | 'assignment';
    title: string;
    duration: number; // minutes
    totalMarks: number;
    unitsCovered: number[]; // unit numbers
    sections: RubricSection[];
    difficultyDistribution: DifficultyDistribution;
    coRequirements: CORequirement[];
    status: 'draft' | 'created' | 'generated';
    createdAt: string;
    generatedAt?: string;
}

export interface CreateRubricInput {
    subjectId: string;
    examType: 'final' | 'midterm' | 'quiz' | 'assignment';
    title: string;
    duration: number;
    totalMarks: number;
    unitsCovered: number[];
    sections: RubricSection[];
    difficultyDistribution: DifficultyDistribution;
    coRequirements: CORequirement[];
}

// Vetter types
export interface VettingBatch {
    id: string;
    rubricId: string;
    subjectId: string;
    title: string;
    facultyName: string;
    totalQuestions: number;
    reviewedQuestions: number;
    approvedCount: number;
    rejectedCount: number;
    quarantinedCount: number;
    generatedAt: string;
    dueDate?: string;
    status: 'pending' | 'in_progress' | 'completed';
    questions: Question[];
    subjectCOs?: Array<{ id: number; code: string; description: string }>;
    subjectLOs?: Array<{ id: number; code: string; description: string }>;
}

export interface VetterStats {
    totalReviewedThisWeek: number;
    totalReviewedThisMonth: number;
    approvalRate: number;
    averageTimePerQuestion: number; // seconds
    rejectionReasons: Record<string, number>;
}

export interface ReviewAction {
    questionId: string;
    action: 'approve' | 'reject' | 'quarantine';
    reason?: string;
    notes?: string;
    timestamp: string;
}

export interface QuestionFilters {
    subjectId?: string;
    topicId?: string;
    type?: QuestionType;
    difficulty?: DifficultyLevel;
    status?: 'pending' | 'approved' | 'rejected' | 'quarantined';
}

export interface ValidationResult {
    isValid: boolean;
    score: number;
    issues: string[];
}
