export interface Exercise {
  id: number;
  vietnamese: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  hint?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  level: string; // e.g., "Beginner", "Intermediate"
  exercises: Exercise[];
}

export interface AnalysisToken {
  text: string;
  status: 'correct' | 'error';
  correction?: string;
  errorType?: string;
}

export interface AlternativeOption {
  type: 'Formal' | 'Casual' | 'Native';
  text: string;
  context: string;
}

export interface VocabularyItem {
  word: string;
  type: string;
  meaning: string;
  example: string;
}

export interface EvaluationResult {
  score: number;
  correction: string;
  explanation: string;
  isPass: boolean;
  improvedVersion?: string;
  detailedAnalysis: AnalysisToken[];
  alternatives: AlternativeOption[];
  keyTakeaway: string;
  relatedVocabulary: VocabularyItem[];
}

export interface PronunciationWord {
  word: string;
  isCorrect: boolean;
  ipa?: string;
  errorType?: string;
}

export interface PronunciationResult {
  score: number;
  generalFeedback: string;
  words: PronunciationWord[];
}

export enum AppState {
  IDLE = 'IDLE',
  EVALUATING = 'EVALUATING',
  FEEDBACK = 'FEEDBACK',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

// --- NEW TYPES FOR USER MANAGEMENT ---

export interface HistoryEntry {
  id: string;
  timestamp: number;
  lessonId: string;
  exerciseId: number;
  question: string;
  userAnswer: string;
  score: number;
  errorTypes: string[]; // Collected from EvaluationResult.detailedAnalysis
}

export interface LearnerProfile {
  strengths: string[];
  weaknesses: string[];
  recentProgress: 'Improving' | 'Stable' | 'Declining';
  suggestedFocus: string;
  summary: string;
}

export interface User {
  id: string;
  username: string;
  password?: string; // In real app, this is hashed. Here mock only.
  role: 'admin' | 'learner';
  history: HistoryEntry[];
  lastAnalysis?: LearnerProfile;
}