import { Question, Subject, ExamResult, ExamType } from '../types';
import { User } from './auth';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${SUPABASE_URL}/functions/v1`;
  }

  // Authentication
  async login(username: string, password: string, role: 'student' | 'admin'): Promise<User> {
    const response = await fetch(`${this.baseUrl}/auth-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    return data.user;
  }

  async registerStudent(adminUsername: string, fullName: string, regNumber: string) {
    const response = await fetch(`${this.baseUrl}/auth-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminUsername, fullName, regNumber })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    return data.user;
  }

  async changePassword(username: string, oldPassword: string, newPassword: string, role: 'student' | 'admin') {
    const response = await fetch(`${this.baseUrl}/user-change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, oldPassword, newPassword, role })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Password change failed');
    }

    return data;
  }

  // Questions
  async getRandomQuestions(subject: Subject, count: number, examType: ExamType): Promise<Question[]> {
    const response = await fetch(
      `${this.baseUrl}/questions-get?subject=${encodeURIComponent(subject)}&examType=${examType}&count=${count}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch questions');
    }

    return data.questions;
  }

  async getAllQuestions(adminUsername: string): Promise<Question[]> {
    const response = await fetch(
      `${this.baseUrl}/admin-get-all-questions?adminUsername=${encodeURIComponent(adminUsername)}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch questions');
    }

    return data.questions;
  }

  async addQuestions(adminUsername: string, questions: any[]) {
    const response = await fetch(`${this.baseUrl}/questions-add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminUsername, questions })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to add questions');
    }

    return data;
  }

  async deleteQuestion(adminUsername: string, questionId: string) {
    const response = await fetch(`${this.baseUrl}/questions-delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminUsername, questionId })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete question');
    }

    return data;
  }

  // Exam Sessions
  async startExam(userId: string, examType: ExamType, subjects: Subject[], durationSeconds: number) {
    const response = await fetch(`${this.baseUrl}/exam-start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, examType, subjects, durationSeconds })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to start exam');
    }

    return data.session;
  }

  async saveAnswer(sessionId: string, questionId: string, selectedOption: string | null, isMarkedForReview: boolean) {
    const response = await fetch(`${this.baseUrl}/exam-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, questionId, selectedOption, isMarkedForReview })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to save answer');
    }

    return data;
  }

  async submitExam(sessionId: string, userId: string, questions: any, answers: any) {
    const response = await fetch(`${this.baseUrl}/exam-submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, userId, questions, answers })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit exam');
    }

    return data.result;
  }

  // Results
  async getResults(userId: string): Promise<ExamResult[]> {
    const response = await fetch(
      `${this.baseUrl}/results-get?userId=${encodeURIComponent(userId)}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch results');
    }

    return data.results;
  }

  // Admin
  async getStats(adminUsername: string) {
    const response = await fetch(
      `${this.baseUrl}/admin-get-stats?adminUsername=${encodeURIComponent(adminUsername)}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch stats');
    }

    return data.stats;
  }

  async getStudents(adminUsername: string) {
    const response = await fetch(
      `${this.baseUrl}/admin-get-students?adminUsername=${encodeURIComponent(adminUsername)}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch students');
    }

    return data.students;
  }

  async deleteStudent(adminUsername: string, studentUsername: string) {
    const response = await fetch(`${this.baseUrl}/admin-delete-student`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminUsername, studentUsername })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete student');
    }

    return data;
  }

  async clearStudentResults(adminUsername: string, studentUsername: string) {
    const response = await fetch(`${this.baseUrl}/admin-clear-student-results`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminUsername, studentUsername })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to clear results');
    }

    return data;
  }
}

export const api = new ApiService();
