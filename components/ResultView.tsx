
import React, { useState } from 'react';
import { ExamResult } from '../types';
import { CheckCircle, XCircle, RotateCcw, Home, AlertCircle, Moon, Sun } from 'lucide-react';
import { Button } from './Button';

interface Props {
  result: ExamResult;
  onRestart: () => void;
  onHome: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const ResultView: React.FC<Props> = ({ result, onRestart, onHome, theme, toggleTheme }) => {
  const [viewCorrectionSub, setViewCorrectionSub] = useState(result.session.subjects[0]);

  // Use the pre-calculated aggregateScore from the result object
  const aggregate = result.aggregateScore;

  const getScoreColor = (percentage: number) => {
      if (percentage >= 70) return 'bg-green-500 text-green-700 dark:text-green-400';
      if (percentage >= 45) return 'bg-yellow-500 text-yellow-700 dark:text-yellow-400';
      return 'bg-red-500 text-red-700 dark:text-red-400';
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-2 md:p-6 transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* SCORE CARD */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 border-t-8 border-green-600 relative">
            <button 
                onClick={toggleTheme} 
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
            >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} className="text-yellow-400"/>}
            </button>

            <div className="text-center md:text-left w-full md:w-auto">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2">Examination Result</h1>
                <p className="text-gray-500 dark:text-gray-400">Candidate Performance & Corrections</p>
                <div className="mt-4 flex gap-3 justify-center md:justify-start">
                    <Button onClick={onRestart} variant="secondary" className="flex items-center gap-2 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-sm px-4">
                        <RotateCcw size={16} /> Retake
                    </Button>
                    <Button onClick={onHome} variant="outline" className="flex items-center gap-2 text-sm px-4 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                        <Home size={16} /> Dashboard
                    </Button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 w-full md:w-auto bg-green-50 dark:bg-green-900/20 md:bg-transparent p-4 md:p-0 rounded-lg">
                <div className="text-center">
                    <div className="text-5xl font-black text-green-600 dark:text-green-400">{aggregate}</div>
                    <div className="text-xs md:text-sm text-gray-400 uppercase font-bold tracking-wider">Aggregate / 400</div>
                </div>
                <div className="w-full h-px md:w-px md:h-16 bg-gray-200 dark:bg-gray-700 hidden md:block"></div>
                <div className="text-center hidden md:block">
                    <div className="text-3xl font-bold text-gray-700 dark:text-gray-200">{result.totalScore}</div>
                    <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Raw Score ({Object.keys(result.subjectScores).length * 40})</div>
                </div>
            </div>
        </div>

        {/* SUBJECT BREAKDOWN */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            {Object.entries(result.subjectScores).map(([sub, stats]) => {
                const s = stats as { score: number, total: number };
                const percentage = s.total > 0 ? (s.score / s.total) * 100 : 0;
                const colorClass = getScoreColor(percentage);
                const barColor = colorClass.split(' ')[0]; // Extract bg class

                return (
                    <div key={sub} className="bg-white dark:bg-gray-800 p-3 md:p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold text-gray-600 dark:text-gray-400 text-xs md:text-sm mb-1 truncate">{sub}</h3>
                        <div className="flex items-end justify-between">
                            <div className="flex items-end gap-1">
                                <span className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">{s.score}</span>
                                <span className="text-gray-400 text-xs md:text-sm mb-1">/ {s.total}</span>
                            </div>
                            <span className={`text-xs font-bold ${colorClass.split(' ')[1]}`}>{Math.round(percentage)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full mt-2 overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`}
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* CORRECTIONS */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 border-b dark:border-gray-700 flex gap-2 overflow-x-auto custom-scroll">
                {result.session.subjects.map(sub => (
                    <button
                        key={sub}
                        onClick={() => setViewCorrectionSub(sub)}
                        className={`px-4 py-2 rounded text-xs md:text-sm font-bold whitespace-nowrap flex-shrink-0 ${viewCorrectionSub === sub ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                    >
                        {sub}
                    </button>
                ))}
            </div>

            <div className="p-4 md:p-6 space-y-6 md:space-y-8">
                {result.session && result.session.questions ? (
                    result.session.questions[viewCorrectionSub].map((q, idx) => {
                        const userAns = result.session.answers[q.id];
                        const isCorrect = userAns === q.correctOption;
                        const isSkipped = !userAns;
                        
                        let cardBorderClass = 'border-l-4';
                        let cardBgClass = 'bg-white dark:bg-gray-800';
                        
                        if (isCorrect) {
                            cardBorderClass = 'border-l-green-500';
                            cardBgClass = 'bg-green-50/30 dark:bg-green-900/10';
                        } else if (isSkipped) {
                            cardBorderClass = 'border-l-gray-400';
                            cardBgClass = 'bg-gray-50 dark:bg-gray-700/30';
                        } else {
                            cardBorderClass = 'border-l-red-500';
                            cardBgClass = 'bg-red-50/30 dark:bg-red-900/10';
                        }

                        return (
                            <div key={q.id} className={`p-4 rounded-lg ${cardBorderClass} ${cardBgClass} border border-gray-100 dark:border-gray-700`}>
                                <div className="flex gap-3 mb-2 items-start">
                                    <span className="font-bold text-gray-500 dark:text-gray-400 text-sm shrink-0">Q{idx + 1}.</span>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-800 dark:text-gray-200 text-sm md:text-base leading-snug">{q.text}</p>
                                        {isSkipped && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded mt-2"><AlertCircle size={10}/> Not Answered</span>}
                                    </div>
                                </div>
                                
                                <div className="ml-0 md:ml-8 space-y-1 text-sm mt-3 md:mt-0">
                                    {['A', 'B', 'C', 'D'].map(opt => {
                                        const optLabel = opt as 'A' | 'B' | 'C' | 'D';
                                        const isOptCorrect = q.correctOption === optLabel;
                                        const isUserChoice = userAns === optLabel;
                                        
                                        let colorClass = 'text-gray-500 dark:text-gray-400';
                                        if (isOptCorrect) colorClass = 'text-green-700 dark:text-green-400 font-bold';
                                        if (isUserChoice && !isCorrect) colorClass = 'text-red-600 dark:text-red-400';

                                        return (
                                            <div key={opt} className={`flex items-start gap-2 ${colorClass}`}>
                                                <span className="shrink-0">({opt})</span>
                                                <span>{(q as any)[`option${opt}`]}</span>
                                                {isOptCorrect && <CheckCircle size={14} className="mt-1 shrink-0" />}
                                                {isUserChoice && !isCorrect && <XCircle size={14} className="mt-1 shrink-0" />}
                                            </div>
                                        )
                                    })}
                                </div>

                                {q.explanation && (
                                    <div className="mt-3 ml-0 md:ml-8 text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700/50 p-2 rounded border border-gray-100 dark:border-gray-600 inline-block shadow-sm">
                                        <span className="font-bold text-green-800 dark:text-green-400">Explanation:</span> {q.explanation}
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-10 text-gray-400">
                        <p>Detailed questions data not available for this session.</p>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};
