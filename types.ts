
export type Subject = 
  | 'English' 
  | 'Mathematics' 
  | 'Physics' 
  | 'Chemistry' 
  | 'Biology' 
  | 'Agricultural Science'
  | 'Economics' 
  | 'Government' 
  | 'Literature' 
  | 'CRS'
  | 'Geography'
  | 'Commerce'
  | 'Financial Accounting'
  | 'Civic Education'
  | 'Further Mathematics'
  | 'History';

export type ExamType = 'JAMB' | 'WAEC';

export interface Question {
  id: string;
  subject: Subject;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  examType: ExamType; 
}

export interface ExamSession {
  id: string;
  examType: ExamType;
  subjects: Subject[]; 
  questions: Record<Subject, Question[]>; 
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>; 
  markedForReview: string[]; 
  startTime: number;
  durationSeconds: number; 
  isSubmitted: boolean;
}

export interface ExamResult {
  id: string; 
  totalScore: number; 
  aggregateScore: number; 
  subjectScores: Record<Subject, { score: number, total: number }>;
  session: ExamSession;
  timestamp: number;
}
