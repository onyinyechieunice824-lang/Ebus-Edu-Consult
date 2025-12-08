
import React, { useState } from 'react';
import { Button } from './Button';
import { User, loginUser, resetAdminPassword } from '../services/auth';
import { BookOpen, AlertCircle, Lock, User as UserIcon, HelpCircle, ArrowLeft, GraduationCap, CheckCircle, Moon, Sun } from 'lucide-react';
import { ExamType } from '../types';

interface Props {
  onLogin: (user: User, examType: ExamType) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const LoginScreen: React.FC<Props> = ({ onLogin, theme, toggleTheme }) => {
  const [mode, setMode] = useState<'student' | 'admin'>('student');
  const [view, setView] = useState<'login' | 'forgot_password'>('login');
  
  // New state for Exam Type selection
  const [selectedExamType, setSelectedExamType] = useState<ExamType>('JAMB');
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (mode === 'admin') {
        const user = loginUser(formData.username, formData.password, 'admin');
        onLogin(user, 'JAMB'); // Admin access generic
      } else {
        const user = loginUser(formData.username, formData.password, 'student');
        onLogin(user, selectedExamType);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (recoveryKey === 'JAMB-RECOVERY-2024') {
      resetAdminPassword(newAdminPass);
      setSuccessMsg("Password reset successfully! Please login.");
      setTimeout(() => {
        setView('login');
        setSuccessMsg('');
        setRecoveryKey('');
        setNewAdminPass('');
      }, 2000);
    } else {
      setError("Invalid Recovery Key. Contact Support.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans relative bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <div className="relative z-10 flex flex-col min-h-screen">
        <div className="bg-[#006600] dark:bg-green-900 text-white py-6 px-4 shadow-xl border-b-4 border-yellow-500 relative">
            <button 
                onClick={toggleTheme} 
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-green-700/50 text-white transition-colors"
                title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} className="text-yellow-400"/>}
            </button>
            <div className="max-w-6xl mx-auto flex flex-col items-center justify-center text-center gap-3">
                <div className="bg-white p-2 rounded-full border-2 border-yellow-500 shadow-md">
                    <GraduationCap className="text-[#006600] w-10 h-10 md:w-12 md:h-12" />
                </div>
                <div>
                    <h1 className="text-2xl md:text-4xl font-black uppercase tracking-wide leading-tight drop-shadow-md text-white">EBUS EDU CONSULT (EEC)</h1>
                    <p className="text-yellow-400 text-xs md:text-sm font-bold uppercase tracking-[0.25em] mt-2 text-shadow-sm">Computer Based Test (CBT) Portal</p>
                </div>
            </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md shadow-2xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 transform transition-all mt-4">
                
                <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 text-center">
                    <h2 className="text-green-800 dark:text-green-400 font-bold text-lg uppercase tracking-tight">
                        {view === 'forgot_password' ? 'System Recovery' : 'Portal Login'}
                    </h2>
                </div>

                {view === 'forgot_password' ? (
                <div className="p-6 md:p-8">
                    <button onClick={() => { setView('login'); setError(''); }} className="text-xs text-green-700 dark:text-green-400 font-bold flex items-center gap-1 mb-6 hover:underline uppercase tracking-wide">
                    <ArrowLeft size={12}/> Return to Login
                    </button>
                    
                    <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-3 rounded text-xs text-yellow-800 dark:text-yellow-200">
                        <p className="font-bold mb-1">Administrative Reset</p>
                        Please enter the master recovery key provided by EBUS EDU CONSULT.
                    </div>

                    {error && <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}
                    {successMsg && <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 text-green-700 dark:text-green-300 text-xs font-bold flex items-center gap-2"><BookOpen size={16} /> {successMsg}</div>}

                    <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Master Key</label>
                        <input 
                        type="password"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none transition-colors" 
                        value={recoveryKey}
                        onChange={e => setRecoveryKey(e.target.value)}
                        required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">New Password</label>
                        <input 
                        type="password"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none transition-colors" 
                        value={newAdminPass}
                        onChange={e => setNewAdminPass(e.target.value)}
                        required
                        minLength={6}
                        />
                    </div>
                    <Button className="w-full bg-[#006600] hover:bg-green-800 text-white rounded font-bold uppercase text-xs py-3 tracking-wider">
                        Reset Access
                    </Button>
                    </form>
                </div>
                ) : (
                <>
                    <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button 
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${mode === 'student' ? 'text-[#006600] dark:text-green-400 border-b-2 border-[#006600] dark:border-green-400 bg-white dark:bg-gray-800' : 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        onClick={() => { setMode('student'); setError(''); }}
                    >
                        <UserIcon size={14} /> Candidate
                    </button>
                    <button 
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${mode === 'admin' ? 'text-[#006600] dark:text-green-400 border-b-2 border-[#006600] dark:border-green-400 bg-white dark:bg-gray-800' : 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        onClick={() => { setMode('admin'); setError(''); }}
                    >
                        <Lock size={14} /> Administrator
                    </button>
                    </div>

                    <div className="p-6 md:p-8">
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-xs rounded flex items-start gap-2">
                        <AlertCircle size={14} className="mt-0.5 shrink-0" /> <span className="font-semibold">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        
                        {mode === 'student' && (
                            <div>
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Select Exam Category</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedExamType('JAMB')}
                                        className={`p-3 rounded border-2 flex items-center justify-center gap-2 text-sm font-bold transition-all ${selectedExamType === 'JAMB' ? 'border-green-600 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'}`}
                                    >
                                        JAMB {selectedExamType === 'JAMB' && <CheckCircle size={16}/>}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedExamType('WAEC')}
                                        className={`p-3 rounded border-2 flex items-center justify-center gap-2 text-sm font-bold transition-all ${selectedExamType === 'WAEC' ? 'border-green-600 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'}`}
                                    >
                                        WAEC {selectedExamType === 'WAEC' && <CheckCircle size={16}/>}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">
                            {mode === 'admin' ? 'Username / Email' : 'JAMB/WAEC Registration Number'}
                        </label>
                        <div className="relative">
                            <input 
                                name="username" 
                                placeholder={mode === 'admin' ? 'Enter Username' : 'Enter Reg Number'} 
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500 font-mono text-sm" 
                                onChange={handleChange} 
                                required
                            />
                        </div>
                        </div>

                        <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Password</label>
                        <input 
                            type="password" 
                            name="password" 
                            placeholder="••••••••" 
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-green-600 focus:ring-1 focus:ring-green-600 outline-none transition-colors font-mono text-sm" 
                            onChange={handleChange} 
                            required
                        />
                        </div>

                        <Button className="w-full bg-[#006600] hover:bg-green-800 text-white font-bold py-3 rounded uppercase text-sm tracking-wider shadow-none hover:shadow-md transition-all border border-green-800">
                            {mode === 'admin' ? 'Login' : `Login to ${selectedExamType} Portal`}
                        </Button>
                    </form>

                    {mode === 'admin' && (
                        <div className="mt-6 text-center">
                        <button onClick={() => setView('forgot_password')} className="text-xs text-green-700 dark:text-green-400 font-bold hover:underline flex items-center justify-center gap-1 mx-auto">
                            <HelpCircle size={12}/> Reset Password
                        </button>
                        </div>
                    )}

                    {mode === 'student' && (
                        <div className="mt-8 text-center border-t border-gray-100 dark:border-gray-700 pt-4">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-widest">
                            System Secured by EBUS EDU CONSULT
                        </p>
                        </div>
                    )}
                    </div>
                </>
                )}
            </div>
        </div>
        
        <footer className="bg-green-950/80 backdrop-blur-sm border-t border-green-800 py-4 text-center text-xs text-green-100/70 font-medium">
            &copy; {new Date().getFullYear()} EBUS EDU CONSULT (EEC). All Rights Reserved.
        </footer>
      </div>
    </div>
  );
};
