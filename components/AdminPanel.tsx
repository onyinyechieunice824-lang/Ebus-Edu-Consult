
import React, { useState, useEffect } from 'react';
import { Subject, Question, ExamType } from '../types';
import { addQuestionToBank, getBankStats, resetDatabase, clearStudentResults, addBulkQuestions, getAllQuestions, deleteQuestion } from '../services/db';
import { registerStudent, getAllStudents, deleteStudent, User, changePassword } from '../services/auth';
import { LogOut, Upload, Save, Database, FileText, CheckCircle, AlertTriangle, RefreshCw, Trash2, ShieldAlert, Users, Plus, Settings, Key, GraduationCap, Moon, Sun, Search, List } from 'lucide-react';
import { Button } from './Button';

interface Props {
  onBack: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const SUBJECTS: Subject[] = ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Government', 'Literature', 'CRS'];

interface LogEntry {
  line: number;
  status: 'success' | 'error';
  message: string;
}

export const AdminPanel: React.FC<Props> = ({ onBack, theme, toggleTheme }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'add' | 'bulk' | 'settings' | 'questions'>('stats');
  const [stats, setStats] = useState(getBankStats());
  
  // Student Management State
  const [students, setStudents] = useState<User[]>([]);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentReg, setNewStudentReg] = useState('');

  // Question Bank View State
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);

  // Password Change State
  const [pwdData, setPwdData] = useState({ old: '', new: '', confirm: '' });

  // Question Management State
  const [targetExam, setTargetExam] = useState<ExamType>('JAMB');
  const [newQ, setNewQ] = useState<Partial<Question>>({ subject: 'Mathematics', correctOption: 'A' });
  const [bulkText, setBulkText] = useState('');
  const [uploadLog, setUploadLog] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (activeTab === 'users') {
      setStudents(getAllStudents());
    }
    if (activeTab === 'questions') {
      setAllQuestions(getAllQuestions());
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'questions') {
        const lowerTerm = searchTerm.toLowerCase();
        setFilteredQuestions(allQuestions.filter(q => 
            q.text.toLowerCase().includes(lowerTerm) || 
            q.subject.toLowerCase().includes(lowerTerm) ||
            q.id.toLowerCase().includes(lowerTerm)
        ));
    }
  }, [searchTerm, allQuestions, activeTab]);

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName || !newStudentReg) return;
    try {
      registerStudent(newStudentName, newStudentReg);
      setStudents(getAllStudents());
      setNewStudentName('');
      setNewStudentReg('');
      alert("Candidate registered successfully! Login details generated.");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteStudent = (username: string) => {
    if (confirm(`Delete student ${username}?`)) {
      deleteStudent(username);
      setStudents(getAllStudents());
    }
  };

  const handleDeleteQuestion = (id: string) => {
      if (confirm("Delete this question? This cannot be undone.")) {
          try {
              deleteQuestion(id);
              setAllQuestions(getAllQuestions()); // Refresh list
              setStats(getBankStats()); // Refresh stats
          } catch (e: any) {
              alert(e.message);
          }
      }
  };

  const handleClearProgress = (username: string) => {
    if (confirm(`Are you sure you want to clear ALL exam records/history for candidate ${username}? This cannot be undone.`)) {
        clearStudentResults(username);
        alert("Candidate progress cleared successfully.");
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdData.new !== pwdData.confirm) return alert("New passwords do not match");
    
    try {
        changePassword('admin', pwdData.old, pwdData.new, 'admin');
        alert("Password changed successfully!");
        setPwdData({ old: '', new: '', confirm: '' });
    } catch (err: any) {
        alert(err.message);
    }
  };

  const handleReset = () => {
      if(confirm("Restore Default Questions? This will remove custom questions and reload the sample set.")) {
          resetDatabase(false);
          setStats(getBankStats());
          setAllQuestions(getAllQuestions());
          alert("Database restored to defaults.");
      }
  };

  const handleWipe = () => {
      if(confirm("⚠️ DANGER: Are you sure you want to WIPE EVERYTHING? \n\nThis will remove ALL questions (including defaults). The database will be empty. You must upload questions immediately after this.")) {
          resetDatabase(true);
          setStats(getBankStats());
          setAllQuestions(getAllQuestions());
          alert("Database is now EMPTY. Please upload questions now.");
      }
  };

  const handleSingleAdd = () => {
    if (!newQ.text || !newQ.optionA || !newQ.optionB) return alert("Fill all fields");
    
    addQuestionToBank({
        ...newQ,
        examType: targetExam,
        id: `custom-${Date.now()}`,
    } as Question);
    
    alert(`Question Added & Saved to ${targetExam} Bank!`);
    setStats(getBankStats());
    setNewQ({ subject: 'Mathematics', correctOption: 'A', text: '', optionA: '', optionB: '', optionC: '', optionD: '' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setBulkText(content);
        setUploadLog([]); 
      };
      reader.readAsText(file);
    }
  };

  const parseCSVLine = (text: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
            if (inQuote && text[i+1] === '"') {
                cur += '"';
                i++;
            } else {
                inQuote = !inQuote;
            }
        } else if (c === ',' && !inQuote) {
            result.push(cur.trim());
            cur = '';
        } else {
            cur += c;
        }
    }
    result.push(cur.trim());
    return result;
  };

  const normalizeSubject = (input: string): Subject | null => {
    if (!input) return null;
    const s = input.toLowerCase().trim().replace(/['"]+/g, '');
    if (s.includes('math')) return 'Mathematics';
    if (s.includes('eng')) return 'English';
    if (s.includes('phy')) return 'Physics';
    if (s.includes('chem')) return 'Chemistry';
    if (s.includes('bio')) return 'Biology';
    if (s.includes('eco')) return 'Economics';
    if (s.includes('gov')) return 'Government';
    if (s.includes('lit')) return 'Literature';
    if (s.includes('crs') || s.includes('christian') || s.includes('rel')) return 'CRS';
    if (s.includes('comm')) return 'Commerce';
    if (s.includes('agric')) return 'Agricultural Science';
    if (s.includes('geo')) return 'Geography';
    return null;
  };

  const handleBulkUpload = () => {
    if (!bulkText.trim()) return;

    const lines = bulkText.split(/\r?\n/);
    const logs: LogEntry[] = [];
    const validQuestions: Question[] = [];
    
    lines.forEach((line, index) => {
        const lineNum = index + 1;
        if (!line.trim()) return;
        
        let parts = line.split('|');
        if (parts.length < 7) {
            parts = parseCSVLine(line);
        }

        if (index === 0 && parts[0].toLowerCase().includes('subject')) {
            logs.push({ line: lineNum, status: 'success', message: 'Skipped Header Row' });
            return;
        }

        if (parts.length < 7) {
            logs.push({ line: lineNum, status: 'error', message: `Line ${lineNum}: Not enough columns.` });
            return;
        }

        const [rawSub, txt, a, b, c, d, rawAns, expl] = parts;
        const subject = normalizeSubject(rawSub);
        
        if (!subject) {
            logs.push({ line: lineNum, status: 'error', message: `Line ${lineNum}: Unknown Subject "${rawSub}".` });
            return;
        }

        const ansMatch = rawAns?.toUpperCase().match(/[A-D]/);
        if (!ansMatch) {
             logs.push({ line: lineNum, status: 'error', message: `Line ${lineNum}: Invalid Answer.` });
             return;
        }
        const correctOption = ansMatch[0] as any;

        validQuestions.push({
            id: `bulk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            examType: targetExam, // Use selected exam type
            subject: subject,
            text: txt.replace(/^"|"$/g, '').trim(),
            optionA: a.replace(/^"|"$/g, '').trim(),
            optionB: b.replace(/^"|"$/g, '').trim(),
            optionC: c.replace(/^"|"$/g, '').trim(),
            optionD: d.replace(/^"|"$/g, '').trim(),
            correctOption: correctOption,
            explanation: expl ? expl.replace(/^"|"$/g, '').trim() : ''
        });
        
        logs.push({ line: lineNum, status: 'success', message: `Queued for ${subject} [${targetExam}]` });
    });
    
    if (validQuestions.length > 0) {
        const addedCount = addBulkQuestions(validQuestions);
        alert(`Successfully added and saved ${addedCount} new questions to ${targetExam} Bank.`);
    } else {
        alert("No valid questions found to add.");
    }
    
    setUploadLog(logs);
    setStats(getBankStats());
    if (validQuestions.length > 0) {
        setBulkText('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-2 md:p-6 transition-colors duration-300">
        <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg min-h-[600px] flex flex-col overflow-hidden">
            {/* Header Branding */}
            <div className="p-4 md:p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center bg-green-900 text-white gap-4 border-t-4 border-yellow-500">
                <div className="flex items-center gap-3">
                    <div className="bg-white p-1.5 rounded-full border-2 border-yellow-500">
                        <GraduationCap className="text-green-800 w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold tracking-tight">EBUS EDU CONSULT (EEC)</h1>
                        <p className="text-yellow-400 text-[10px] font-bold uppercase tracking-widest">Admin Control Center</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                    <button onClick={() => setActiveTab('stats')} className={`px-3 py-1.5 md:px-4 md:py-2 rounded font-medium text-xs md:text-sm transition-colors ${activeTab === 'stats' ? 'bg-yellow-500 text-green-900' : 'bg-green-800 hover:bg-green-700'}`}>Stats</button>
                    <button onClick={() => setActiveTab('users')} className={`px-3 py-1.5 md:px-4 md:py-2 rounded font-medium text-xs md:text-sm transition-colors ${activeTab === 'users' ? 'bg-yellow-500 text-green-900' : 'bg-green-800 hover:bg-green-700'}`}>Candidates</button>
                    <button onClick={() => setActiveTab('questions')} className={`px-3 py-1.5 md:px-4 md:py-2 rounded font-medium text-xs md:text-sm transition-colors ${activeTab === 'questions' ? 'bg-yellow-500 text-green-900' : 'bg-green-800 hover:bg-green-700'}`}><List size={16} className="inline mr-1"/> Bank</button>
                    <button onClick={() => setActiveTab('add')} className={`px-3 py-1.5 md:px-4 md:py-2 rounded font-medium text-xs md:text-sm transition-colors ${activeTab === 'add' ? 'bg-yellow-500 text-green-900' : 'bg-green-800 hover:bg-green-700'}`}>Add</button>
                    <button onClick={() => setActiveTab('bulk')} className={`px-3 py-1.5 md:px-4 md:py-2 rounded font-medium text-xs md:text-sm transition-colors ${activeTab === 'bulk' ? 'bg-yellow-500 text-green-900' : 'bg-green-800 hover:bg-green-700'}`}>Upload</button>
                    <button onClick={() => setActiveTab('settings')} className={`px-3 py-1.5 md:px-3 md:py-2 rounded font-medium text-xs md:text-sm transition-colors ${activeTab === 'settings' ? 'bg-yellow-500 text-green-900' : 'bg-green-800 hover:bg-green-700'}`}><Settings size={16} className="md:w-[18px] md:h-[18px]"/></button>
                    
                    <button onClick={toggleTheme} className="px-3 py-1.5 rounded font-medium text-xs md:text-sm bg-black/20 hover:bg-black/30 transition-colors text-white" title="Toggle Theme">
                        {theme === 'light' ? <Moon size={16}/> : <Sun size={16} className="text-yellow-400"/>}
                    </button>

                    <button onClick={onBack} className="px-3 py-1.5 md:px-4 md:py-2 rounded font-medium text-xs md:text-sm bg-red-600 hover:bg-red-700 flex items-center gap-2 shadow-lg ml-auto md:ml-2">
                        <LogOut size={16}/> <span className="hidden md:inline">Logout</span>
                    </button>
                </div>
            </div>

            <div className="p-4 md:p-8 flex-1 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
                {activeTab === 'stats' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                            {Object.entries(stats).map(([sub, counts]) => {
                                const c = counts as { JAMB: number, WAEC: number };
                                const total = c.JAMB + c.WAEC;
                                return (
                                <div key={sub} className={`p-4 md:p-6 rounded-lg border-b-4 text-center bg-white dark:bg-gray-800 shadow-sm transition-transform hover:-translate-y-1 ${total >= 40 ? 'border-green-500' : 'border-orange-500'}`}>
                                    <Database className={`mx-auto mb-2 ${total >= 40 ? 'text-green-500' : 'text-orange-500'}`} />
                                    <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm md:text-base">{sub}</h3>
                                    <div className="flex justify-center gap-2 my-2 text-xs font-mono">
                                        <span className="bg-green-100 text-green-800 px-1 rounded">J: {c.JAMB}</span>
                                        <span className="bg-blue-100 text-blue-800 px-1 rounded">W: {c.WAEC}</span>
                                    </div>
                                    <p className={`text-[10px] md:text-xs uppercase font-bold tracking-wide ${total >= 40 ? 'text-green-600' : 'text-orange-600'}`}>
                                        {total >= 40 ? 'Ready' : 'Insufficient'}
                                    </p>
                                </div>
                                );
                            })}
                        </div>
                        
                        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8">
                             <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                <ShieldAlert className="text-red-600"/> Danger Zone
                             </h3>
                             <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={handleReset} className="px-6 py-3 rounded bg-gray-600 hover:bg-gray-700 text-white flex items-center justify-center gap-2 font-bold text-sm">
                                    <RefreshCw size={16}/> Restore Defaults
                                </button>
                                <button onClick={handleWipe} className="px-6 py-3 rounded bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 font-bold shadow-md text-sm">
                                    <Trash2 size={16}/> Wipe All Data
                                </button>
                             </div>
                        </div>
                    </div>
                )}

                {activeTab === 'questions' && (
                    <div className="h-full flex flex-col">
                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    type="text"
                                    placeholder="Search questions by text, subject, or ID..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                <Database size={16}/> {filteredQuestions.length} Questions
                            </div>
                        </div>

                        <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                            <div className="overflow-x-auto h-full">
                                <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                                    <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3 w-24">Type</th>
                                            <th className="px-4 py-3 w-32">Subject</th>
                                            <th className="px-4 py-3">Question Text</th>
                                            <th className="px-4 py-3 w-20 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {filteredQuestions.slice(0, 100).map((q) => (
                                            <tr key={q.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${q.examType === 'JAMB' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                                        {q.examType || 'JAMB'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{q.subject}</td>
                                                <td className="px-4 py-3 truncate max-w-md" title={q.text}>{q.text}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <button 
                                                        onClick={() => handleDeleteQuestion(q.id)}
                                                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                                        title="Delete Question"
                                                    >
                                                        <Trash2 size={16}/>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredQuestions.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic">No questions found matching your search.</td>
                                            </tr>
                                        )}
                                        {filteredQuestions.length > 100 && (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-3 text-center text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700">
                                                    Showing first 100 of {filteredQuestions.length} results. Use search to find specific items.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                  <div className="h-full flex flex-col">
                    <div className="flex flex-col lg:flex-row gap-6 mb-8">
                      <div className="w-full lg:w-1/3 bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm h-fit">
                        <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white flex items-center gap-2 border-b dark:border-gray-700 pb-2"><Plus size={18}/> Register Candidate</h3>
                        <form onSubmit={handleCreateStudent} className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Full Name</label>
                            <input 
                              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-600 transition-colors"
                              placeholder="John Doe"
                              value={newStudentName}
                              onChange={e => setNewStudentName(e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Reg Number (Username)</label>
                            <input 
                              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-600 transition-colors"
                              placeholder="20241029AB"
                              value={newStudentReg}
                              onChange={e => setNewStudentReg(e.target.value)}
                              required
                            />
                          </div>
                          <Button className="w-full bg-green-700 hover:bg-green-800 text-white py-3 shadow-md mt-2">
                            Create Account
                          </Button>
                        </form>
                      </div>

                      <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                        <div className="bg-gray-100 dark:bg-gray-700 p-4 border-b dark:border-gray-600 font-bold text-gray-700 dark:text-gray-200 flex justify-between items-center">
                          <span className="flex items-center gap-2"><Users size={18}/> Registered Candidates</span>
                          <span className="bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-xs">{students.length}</span>
                        </div>
                        <div className="overflow-x-auto">
                          <div className="min-w-[600px] max-h-[500px] overflow-y-auto">
                            <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                                <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3">Full Name</th>
                                    <th className="px-6 py-3">Reg No (User)</th>
                                    <th className="px-6 py-3">Password</th>
                                    <th className="px-6 py-3 text-right">Action</th>
                                </tr>
                                </thead>
                                <tbody>
                                {students.map((student) => (
                                    <tr key={student.username} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{student.fullName}</td>
                                    <td className="px-6 py-4 font-mono text-blue-600 dark:text-blue-400 font-bold">{student.username}</td>
                                    <td className="px-6 py-4"><span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded font-mono font-bold tracking-wider border border-yellow-200 dark:border-yellow-800 select-all">{student.password}</span></td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button 
                                        onClick={() => handleClearProgress(student.username)}
                                        className="text-orange-500 hover:text-orange-700 dark:hover:text-orange-400 p-2 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-full transition-colors"
                                        title="Clear Exam Records/History"
                                        >
                                        <RefreshCw size={16}/>
                                        </button>
                                        <button 
                                        onClick={() => handleDeleteStudent(student.username)}
                                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                                        title="Delete User"
                                        >
                                        <Trash2 size={16}/>
                                        </button>
                                    </td>
                                    </tr>
                                ))}
                                {students.length === 0 && (
                                    <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">No candidates registered yet.</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Question Management Tabs */}
                {(activeTab === 'add' || activeTab === 'bulk') && (
                    <div className="max-w-4xl mx-auto mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4 justify-center">
                        <span className="font-bold text-gray-600 dark:text-gray-300 uppercase text-xs">Target Question Bank:</span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setTargetExam('JAMB')}
                                className={`px-4 py-2 rounded font-bold text-sm transition-colors border ${targetExam === 'JAMB' ? 'bg-green-600 text-white border-green-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600'}`}
                            >
                                JAMB
                            </button>
                            <button 
                                onClick={() => setTargetExam('WAEC')}
                                className={`px-4 py-2 rounded font-bold text-sm transition-colors border ${targetExam === 'WAEC' ? 'bg-blue-600 text-white border-blue-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600'}`}
                            >
                                WAEC
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'add' && (
                    <div className="space-y-4 max-w-lg mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="font-bold text-lg border-b dark:border-gray-700 pb-2 mb-4 text-green-900 dark:text-green-400">Add New Question ({targetExam})</h3>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Subject</label>
                            <select 
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={newQ.subject}
                                onChange={e => setNewQ({...newQ, subject: e.target.value as Subject})}
                            >
                                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Question Text</label>
                            <textarea 
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded h-24 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={newQ.text || ''}
                                onChange={e => setNewQ({...newQ, text: e.target.value})}
                                placeholder="Enter question..."
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {(['A', 'B', 'C', 'D'] as const).map(opt => (
                                <div key={opt}>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Option {opt}</label>
                                    <input 
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                        value={(newQ as any)[`option${opt}`] || ''}
                                        onChange={e => setNewQ({...newQ, [`option${opt}`]: e.target.value})}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Correct Answer</label>
                                <select 
                                    className="w-full p-2 border-2 border-green-500 rounded bg-green-50 dark:bg-green-900/20 font-bold text-green-900 dark:text-green-400"
                                    value={newQ.correctOption}
                                    onChange={e => setNewQ({...newQ, correctOption: e.target.value as any})}
                                >
                                    <option value="A">Option A</option>
                                    <option value="B">Option B</option>
                                    <option value="C">Option C</option>
                                    <option value="D">Option D</option>
                                </select>
                            </div>
                        </div>
                         
                        <div className="mt-4">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Explanation (Optional)</label>
                            <input 
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={newQ.explanation || ''}
                                onChange={e => setNewQ({...newQ, explanation: e.target.value})}
                            />
                        </div>

                        <Button onClick={handleSingleAdd} className="w-full mt-6 bg-green-700 hover:bg-green-800 text-white font-bold"><Save size={16} className="mr-2 inline"/> Save to {targetExam}</Button>
                    </div>
                )}

                {activeTab === 'bulk' && (
                    <div className="h-full flex flex-col md:flex-row gap-6">
                        <div className="flex-1 flex flex-col">
                             <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded text-sm text-blue-800 dark:text-blue-300 mb-4 border border-blue-200 dark:border-blue-800 shadow-sm">
                                <div className="flex items-center gap-2 font-bold mb-2">
                                    <FileText size={16}/> Bulk Format
                                </div>
                                <p className="text-xs mb-2">Uploading to: <strong className="uppercase">{targetExam} Database</strong></p>
                                <div className="text-xs space-y-2">
                                    <div className="bg-white dark:bg-gray-800 p-2 rounded border border-blue-100 dark:border-blue-900 font-mono overflow-x-auto text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                        Subject, Question, Option A, Option B, Option C, Option D, Answer, Explanation
                                    </div>
                                </div>
                             </div>

                             <div className="mb-4">
                                <input 
                                    type="file" 
                                    accept=".csv,.txt"
                                    onChange={handleFileUpload}
                                    className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 dark:file:bg-green-900 file:text-green-700 dark:file:text-green-300 hover:file:bg-green-100 cursor-pointer"
                                />
                             </div>

                             <textarea 
                                className="w-full flex-1 p-4 border border-gray-300 dark:border-gray-600 rounded font-mono text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:bg-gray-50 dark:focus:bg-gray-600 min-h-[200px]"
                                placeholder={`Paste CSV content here for ${targetExam}...`}
                                value={bulkText}
                                onChange={e => setBulkText(e.target.value)}
                             ></textarea>
                             
                             <Button onClick={handleBulkUpload} className="mt-4 bg-green-700 hover:bg-green-800 text-white w-full font-bold shadow-md">
                                <Upload size={16} className="mr-2 inline"/> Process & Save to {targetExam}
                             </Button>
                        </div>
                        
                        <div className="w-full md:w-1/3 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 overflow-y-auto max-h-[300px] md:max-h-[500px] shadow-sm">
                            <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-2 sticky top-0 bg-white dark:bg-gray-800 pb-2 border-b dark:border-gray-700">Processing Log</h3>
                            {uploadLog.length === 0 && <p className="text-gray-400 text-sm italic">Logs will appear here...</p>}
                            <div className="space-y-2 text-xs font-mono">
                                {uploadLog.map((log, idx) => (
                                    <div key={idx} className={`p-2 rounded border ${log.status === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'}`}>
                                        <div className="flex items-center gap-2 font-bold">
                                            {log.status === 'success' ? <CheckCircle size={12}/> : <AlertTriangle size={12}/>}
                                            Line {log.line}
                                        </div>
                                        <div className="break-all mt-1 opacity-90">{log.message}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
