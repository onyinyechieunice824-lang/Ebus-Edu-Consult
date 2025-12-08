
import { Question, Subject, ExamSession, ExamResult, ExamType } from '../types';

// --- AUTHENTIC JAMB PAST QUESTIONS STARTER PACK ---
const REAL_QUESTIONS_RAW = [
  // --- ENGLISH LANGUAGE ---
  { id: 'eng-001', subject: 'English', text: 'From the words lettered A to D, choose the word that best completes the sentence: The young man was ______ with the task of looking after the house.', optionA: 'trusted', optionB: 'entrusted', optionC: 'given', optionD: 'delivered', correctOption: 'B', explanation: 'We say "entrusted with" a task.' },
  { id: 'eng-002', subject: 'English', text: 'Choose the option opposite in meaning to the capitalized word: The soldier was REPRIMANDED for negligence.', optionA: 'Praised', optionB: 'Punished', optionC: 'Dismissed', optionD: 'Rebuked', correctOption: 'A', explanation: 'Reprimand means to scold. Praise is the opposite.' },
  
  // --- MATHEMATICS ---
  { id: 'mat-001', subject: 'Mathematics', text: 'Solve for x: 2x + 5 = 15', optionA: '5', optionB: '10', optionC: '2.5', optionD: '7', correctOption: 'A', explanation: '2x = 10, x = 5.' },
  { id: 'mat-002', subject: 'Mathematics', text: 'Find dy/dx if y = 3cos(4x).', optionA: '12sin(4x)', optionB: '-12sin(4x)', optionC: '12cos(4x)', optionD: '-12cos(4x)', correctOption: 'B', explanation: 'Chain rule: -3sin(4x) * 4 = -12sin(4x).' },

  // --- PHYSICS ---
  { id: 'phy-001', subject: 'Physics', text: 'The SI unit of Power is:', optionA: 'Joule', optionB: 'Watt', optionC: 'Newton', optionD: 'Pascal', correctOption: 'B', explanation: 'Power is measured in Watts.' },
  { id: 'phy-002', subject: 'Physics', text: 'Which of these is a scalar quantity?', optionA: 'Velocity', optionB: 'Force', optionC: 'Mass', optionD: 'Acceleration', correctOption: 'C', explanation: 'Mass has magnitude only.' },

  // --- CHEMISTRY ---
  { id: 'chm-001', subject: 'Chemistry', text: 'The shape of a water (H2O) molecule is:', optionA: 'Linear', optionB: 'Tetrahedral', optionC: 'V-shaped', optionD: 'Trigonal', correctOption: 'C', explanation: 'Bent or V-shaped due to lone pairs.' },
  { id: 'chm-002', subject: 'Chemistry', text: 'Alkanes have the general formula:', optionA: 'CnH2n', optionB: 'CnH2n+2', optionC: 'CnH2n-2', optionD: 'CnH2n+1', correctOption: 'B', explanation: 'Saturated hydrocarbons.' },

  // --- BIOLOGY ---
  { id: 'bio-001', subject: 'Biology', text: 'The powerhouse of the cell is the:', optionA: 'Nucleus', optionB: 'Mitochondria', optionC: 'Ribosome', optionD: 'Golgi body', correctOption: 'B', explanation: 'Generates ATP.' },
  { id: 'bio-002', subject: 'Biology', text: 'Which vitamin deficiency causes night blindness?', optionA: 'Vitamin A', optionB: 'Vitamin B', optionC: 'Vitamin C', optionD: 'Vitamin D', correctOption: 'A', explanation: 'Retinol is vital for eyes.' },

  // --- ECONOMICS ---
  { id: 'eco-001', subject: 'Economics', text: 'A market with a single seller is a:', optionA: 'Monopoly', optionB: 'Duopoly', optionC: 'Oligopoly', optionD: 'Perfect Market', correctOption: 'A', explanation: 'One seller controls the market.' },

  // --- GOVERNMENT ---
  { id: 'gov-001', subject: 'Government', text: 'Nigeria became a republic in:', optionA: '1960', optionB: '1963', optionC: '1966', optionD: '1979', correctOption: 'B', explanation: 'October 1st, 1963.' },

  // --- LITERATURE ---
  { id: 'lit-001', subject: 'Literature', text: 'A sonnet has how many lines?', optionA: '10', optionB: '12', optionC: '14', optionD: '16', correctOption: 'C', explanation: '14 lines.' },

  // --- CRS ---
  { id: 'crs-001', subject: 'CRS', text: 'The first miracle of Jesus was at:', optionA: 'Cana', optionB: 'Galilee', optionC: 'Nazareth', optionD: 'Jerusalem', correctOption: 'A', explanation: 'Water to wine at Cana.' },
];

// Map raw questions to JAMB type by default
const JAMB_STARTER: Question[] = REAL_QUESTIONS_RAW.map(q => ({ ...q, examType: 'JAMB' } as Question));

// Add some sample WAEC questions
const WAEC_STARTER: Question[] = [
    { id: 'waec-mat-001', subject: 'Mathematics', examType: 'WAEC', text: '[WAEC] Simplify: (2/3) + (1/4)', optionA: '11/12', optionB: '3/7', optionC: '1/2', optionD: '5/6', correctOption: 'A', explanation: 'LCM of 3 and 4 is 12. (8+3)/12 = 11/12.' },
    { id: 'waec-eng-001', subject: 'English', examType: 'WAEC', text: '[WAEC] Choose the best option: The meeting was called _____ because of the rain.', optionA: 'out', optionB: 'off', optionC: 'up', optionD: 'away', correctOption: 'B', explanation: 'Call off means to cancel.' },
];

const INITIAL_DB: Question[] = [...JAMB_STARTER, ...WAEC_STARTER];

// Add new subjects to the DB list for filtering
const SUBJECTS: Subject[] = ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Government', 'Literature', 'CRS', 'Agricultural Science', 'Geography', 'Commerce', 'Financial Accounting', 'Civic Education', 'Further Mathematics', 'History'];

// --- LOCAL STORAGE PERSISTENCE ---
const STORAGE_KEY = 'jamb_cbt_custom_questions'; // Keeping same key for backward compatibility, but new format will have examType
const RESULTS_KEY = 'jamb_cbt_results';

const loadStoredQuestions = (): Question[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    // Migration: If old questions lack examType, default to JAMB
    return parsed.map((q: any) => ({
        ...q,
        examType: q.examType || 'JAMB'
    }));
  } catch (error) {
    console.error("Failed to load questions from storage", error);
    return [];
  }
};

// Initialize Bank
let GLOBAL_QUESTION_BANK: Question[] = [...INITIAL_DB, ...loadStoredQuestions()];

export const getAllQuestions = (): Question[] => {
  return GLOBAL_QUESTION_BANK;
};

export const deleteQuestion = (id: string) => {
  // Can only delete custom questions, not starter pack
  if (INITIAL_DB.some(q => q.id === id)) {
    throw new Error("Cannot delete default system questions.");
  }
  
  GLOBAL_QUESTION_BANK = GLOBAL_QUESTION_BANK.filter(q => q.id !== id);
  persistCustomQuestions();
};

export const addQuestionToBank = (q: Question) => {
  // Deduplication check
  const duplicate = GLOBAL_QUESTION_BANK.find(existing => 
    existing.subject === q.subject && 
    existing.examType === q.examType &&
    existing.text.toLowerCase().trim() === q.text.toLowerCase().trim()
  );

  if (duplicate) {
    console.warn("Duplicate question skipped:", q.text.substring(0, 30));
    return;
  }

  GLOBAL_QUESTION_BANK.push(q);
  persistCustomQuestions();
};

export const addBulkQuestions = (questions: Question[]) => {
  const newQuestions: Question[] = [];
  
  questions.forEach(q => {
      const duplicate = GLOBAL_QUESTION_BANK.find(existing => 
        existing.subject === q.subject && 
        existing.examType === q.examType &&
        existing.text.toLowerCase().trim() === q.text.toLowerCase().trim()
      );
      if (!duplicate) {
          GLOBAL_QUESTION_BANK.push(q);
          newQuestions.push(q);
      }
  });

  if (newQuestions.length > 0) {
      persistCustomQuestions();
      console.log(`Successfully batch saved ${newQuestions.length} questions`);
  }
  return newQuestions.length;
};

const persistCustomQuestions = () => {
    // Persist only custom questions (those not in the starter packs)
    const customQuestions = GLOBAL_QUESTION_BANK.filter(
        bankQ => !INITIAL_DB.some(realQ => realQ.id === bankQ.id)
    );
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customQuestions));
    } catch (e) {
        console.error("Storage full or error saving questions", e);
    }
};

export const resetDatabase = (clearAll: boolean = false) => {
  if (clearAll) {
    localStorage.removeItem(STORAGE_KEY);
    GLOBAL_QUESTION_BANK = [];
  } else {
    // Soft reset: remove custom uploads but keep real questions
    localStorage.removeItem(STORAGE_KEY);
    GLOBAL_QUESTION_BANK = [...INITIAL_DB];
  }
};

export const getBankStats = () => {
  const stats: Record<string, { JAMB: number, WAEC: number }> = {};
  
  SUBJECTS.forEach(sub => {
    const subQs = GLOBAL_QUESTION_BANK.filter(q => q.subject === sub);
    stats[sub] = {
        JAMB: subQs.filter(q => q.examType === 'JAMB').length,
        WAEC: subQs.filter(q => q.examType === 'WAEC').length
    };
  });
  return stats;
};

// Fisher-Yates Shuffle Generic
const shuffle = <T>(array: T[]): T[] => {
    const arr = [...array]; 
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

// Randomize options (A-D) for a specific question instance
const randomizeOptions = (q: Question): Question => {
    const options = [
        { id: 'A', text: q.optionA },
        { id: 'B', text: q.optionB },
        { id: 'C', text: q.optionC },
        { id: 'D', text: q.optionD },
    ];
    
    const correctText = options.find(o => o.id === q.correctOption)?.text;
    const shuffledOpts = shuffle(options);
    const newCorrectIndex = shuffledOpts.findIndex(o => o.text === correctText);
    const keys: ('A'|'B'|'C'|'D')[] = ['A', 'B', 'C', 'D'];

    return {
        ...q,
        optionA: shuffledOpts[0].text,
        optionB: shuffledOpts[1].text,
        optionC: shuffledOpts[2].text,
        optionD: shuffledOpts[3].text,
        correctOption: keys[newCorrectIndex] || 'A'
    };
};

export const getRandomQuestions = (subject: Subject, count: number, examType: ExamType): Question[] => {
  const subjectQuestions = GLOBAL_QUESTION_BANK.filter(q => q.subject === subject && q.examType === examType);
  
  if (subjectQuestions.length === 0) {
      return Array(count).fill(null).map((_, i) => ({
          id: `error-${subject}-${i}`,
          subject,
          examType,
          text: `No ${examType} questions found for ${subject}. Please upload questions in Admin Panel.`,
          optionA: 'N/A', optionB: 'N/A', optionC: 'N/A', optionD: 'N/A',
          correctOption: 'A'
      }));
  }

  // Recycle logic if fewer questions than needed
  const result: Question[] = [];
  let pool = shuffle(subjectQuestions);
  
  while (result.length < count) {
      if (pool.length === 0) {
          pool = shuffle(subjectQuestions); // Re-shuffle source to change order on repeat
      }
      const q = pool.pop();
      if (q) {
          // Shuffle options for this instance
          result.push({
              ...randomizeOptions(q),
              id: `${q.id}-${Date.now()}-${result.length}-${Math.random().toString(36).substr(2,5)}` 
          });
      }
  }
  return result;
};

export const startExam = (selectedElectives: Subject[], examType: ExamType): ExamSession => {
  let subjects: Subject[] = [];
  let duration = 0;
  let qCount = 40;

  if (examType === 'JAMB') {
      // JAMB: English + 3 Selected. Standard 2 hours.
      const electives = shuffle(selectedElectives.filter(s => s !== 'English')).slice(0, 3);
      subjects = ['English', ...electives];
      duration = 7200; // 2 Hours
      qCount = 40;
  } else {
      // WAEC: Single Subject Exam. 50 minutes.
      // Unlike JAMB, we do NOT force English/Math into every session. 
      // We take strictly what the user clicked (which is passed as selectedElectives).
      subjects = [...selectedElectives];
      duration = 3000; // 50 Minutes per subject
      qCount = 60; // WAEC usually has 50-60 objs
  }
  
  const questions: Record<Subject, Question[]> = {} as any;
  
  subjects.forEach(sub => {
    questions[sub] = getRandomQuestions(sub, qCount, examType);
  });

  return {
    id: `session-${Date.now()}`,
    examType,
    subjects,
    questions,
    answers: {},
    markedForReview: [],
    startTime: Date.now(),
    durationSeconds: duration,
    isSubmitted: false
  };
};

export const calculateResult = (session: ExamSession): ExamResult => {
  let totalScore = 0;
  let totalPossible = 0;
  const subjectScores: any = {};

  session.subjects.forEach(sub => {
    let subScore = 0;
    const questions = session.questions[sub];
    questions.forEach(q => {
      if (session.answers[q.id] === q.correctOption) {
        subScore++;
      }
    });
    subjectScores[sub] = { score: subScore, total: questions.length };
    totalScore += subScore;
    totalPossible += questions.length;
  });

  // JAMB is over 400. 
  // WAEC: If single subject, we can just return percentage or raw.
  // For consistency in the UI which shows "/ 400", we will scale everything to 400 or 100%.
  // Let's use 100 scale for single subject WAEC, or just keep 400 to reuse UI component.
  // Ideally, WAEC is over 100 or 60. But let's standardise to 400 for the generic result view for now.
  const aggregateScore = Math.round((totalScore / totalPossible) * 400);

  return {
    id: `res-${Date.now()}`,
    totalScore,
    aggregateScore,
    subjectScores,
    session,
    timestamp: session.startTime
  };
};

// --- RESULT PERSISTENCE ---

export const saveStudentResult = (username: string, result: ExamResult) => {
  const allResults = JSON.parse(localStorage.getItem(RESULTS_KEY) || '{}');
  const userResults = allResults[username] || [];
  
  if (userResults.length >= 20) {
      userResults.pop(); 
  }

  userResults.unshift(result);
  allResults[username] = userResults;
  
  try {
    localStorage.setItem(RESULTS_KEY, JSON.stringify(allResults));
  } catch (e) {
    console.error("Failed to save result, storage might be full", e);
    const slimResult = { ...result, session: undefined };
    userResults[0] = slimResult;
    allResults[username] = userResults;
    localStorage.setItem(RESULTS_KEY, JSON.stringify(allResults));
  }
};

export const getStudentResults = (username: string): ExamResult[] => {
  const allResults = JSON.parse(localStorage.getItem(RESULTS_KEY) || '{}');
  return allResults[username] || [];
};

export const clearStudentResults = (username: string) => {
  const allResults = JSON.parse(localStorage.getItem(RESULTS_KEY) || '{}');
  if (allResults[username]) {
    delete allResults[username];
    localStorage.setItem(RESULTS_KEY, JSON.stringify(allResults));
  }
};
