
import React, { useState, useEffect } from 'react';
import { SubjectSelection } from './components/SubjectSelection';
import { ExamSimulator } from './components/ExamSimulator';
import { ResultView } from './components/ResultView';
import { AdminPanel } from './components/AdminPanel';
import { LoginScreen } from './components/LoginScreen';
import { startExam, calculateResult, saveStudentResult } from './services/db';
import { ExamSession, ExamResult, Subject, ExamType } from './types';
import { getCurrentUser, logoutUser, User } from './services/auth';

const SAVE_KEY = 'jamb_cbt_progress';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<'login' | 'dashboard' | 'exam' | 'result' | 'admin'>('login');
  const [currentSession, setCurrentSession] = useState<ExamSession | null>(null);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [currentExamType, setCurrentExamType] = useState<ExamType>('JAMB');
  
  // Theme Management
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
      if (typeof window !== 'undefined') {
          return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
      }
      return 'light';
  });

  useEffect(() => {
      if (theme === 'dark') {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
      setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Check for saved user session on mount
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      if (user.role === 'admin') {
        setCurrentScreen('admin');
      } else {
        setCurrentScreen('dashboard');
      }
    } else {
      setCurrentScreen('login');
    }
  }, []);

  // Check for saved exam session
  useEffect(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            setHasSavedSession(true);
            if (parsed.session && parsed.session.examType) {
                setCurrentExamType(parsed.session.examType);
            }
        } catch(e) {}
    }
  }, [currentScreen]);

  const handleLogin = (user: User, examType: ExamType) => {
    setCurrentUser(user);
    setCurrentExamType(examType);
    if (user.role === 'admin') {
      setCurrentScreen('admin');
    } else {
      setCurrentScreen('dashboard');
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setCurrentSession(null);
    setCurrentScreen('login');
  };

  const handleStartExam = (subjects: Subject[]) => {
    localStorage.removeItem(SAVE_KEY);
    const session = startExam(subjects, currentExamType);
    setCurrentSession(session);
    setCurrentScreen('exam');
  };

  const handleResumeExam = () => {
      try {
          const savedData = localStorage.getItem(SAVE_KEY);
          if (savedData) {
              const { session, savedTimeLeft } = JSON.parse(savedData);
              const timeSpentSeconds = session.durationSeconds - savedTimeLeft;
              session.startTime = Date.now() - (timeSpentSeconds * 1000);
              setCurrentSession(session);
              setCurrentExamType(session.examType);
              setCurrentScreen('exam');
          }
      } catch (e) {
          console.error("Failed to resume exam", e);
          alert("Could not resume previous session. Starting fresh.");
          localStorage.removeItem(SAVE_KEY);
          setHasSavedSession(false);
      }
  };

  const handleSubmitExam = (finalSession: ExamSession) => {
    localStorage.removeItem(SAVE_KEY);
    setHasSavedSession(false);
    const result = calculateResult(finalSession);
    
    // Save Result to History
    if (currentUser && currentUser.username) {
        saveStudentResult(currentUser.username, result);
    }

    setExamResult(result);
    setCurrentScreen('result');
  };

  const handleReviewHistory = (result: ExamResult) => {
      if (!result.session) {
          alert("Detailed review data is not available for this record.");
          return;
      }
      setExamResult(result);
      setCurrentScreen('result');
  };

  const handleRestart = () => {
    setCurrentSession(null);
    setExamResult(null);
    setCurrentScreen('dashboard');
  };

  if (!currentUser || currentScreen === 'login') {
    return <LoginScreen onLogin={handleLogin} theme={theme} toggleTheme={toggleTheme} />;
  }

  return (
    <div className="font-sans text-gray-900 dark:text-gray-100 min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      {currentScreen === 'dashboard' && (
        <SubjectSelection 
          user={currentUser}
          examType={currentExamType}
          setExamType={setCurrentExamType}
          onStartExam={handleStartExam} 
          hasSavedSession={hasSavedSession}
          onResume={handleResumeExam}
          onLogout={handleLogout}
          onReview={handleReviewHistory}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}

      {currentScreen === 'exam' && currentSession && (
        <ExamSimulator 
          session={currentSession} 
          user={currentUser}
          onSubmit={handleSubmitExam} 
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}

      {currentScreen === 'result' && examResult && (
        <ResultView 
          result={examResult} 
          onRestart={handleRestart}
          onHome={handleRestart}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}

      {currentScreen === 'admin' && (
        <AdminPanel 
          onBack={handleLogout} 
          theme={theme}
          toggleTheme={toggleTheme}
        /> 
      )}
    </div>
  );
};

export default App;
