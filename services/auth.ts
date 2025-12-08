
import { Subject } from '../types';

export interface User {
  username: string;
  role: 'student' | 'admin';
  fullName?: string;
  regNumber?: string;
  password?: string; // Optional for display in admin panel
}

const USERS_KEY = 'jamb_cbt_users';
const CURRENT_USER_KEY = 'jamb_cbt_current_user';
const ADMIN_CONFIG_KEY = 'jamb_cbt_admin_config';

// Default Admin Credentials
const DEFAULT_ADMIN = {
  username: 'danwill4will@gmail.com',
  password: 'ebus1988' 
};

// Get Admin Credentials (Storage > Default)
const getAdminCredentials = () => {
  const stored = localStorage.getItem(ADMIN_CONFIG_KEY);
  return stored ? JSON.parse(stored) : DEFAULT_ADMIN;
};

// Initialize Users storage if empty
const getUsers = (): any[] => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

export const registerStudent = (fullName: string, regNumber: string) => {
  const users = getUsers();
  const username = regNumber.trim().toUpperCase(); // Username is the Reg Number
  
  if (users.find((u: any) => u.username === username)) {
    throw new Error(`Student with Reg Number ${username} already exists`);
  }
  
  // Generate a random 6-character password
  const password = Math.random().toString(36).slice(-6).toUpperCase();

  const newUser = { 
    username, 
    fullName, 
    regNumber: username, 
    role: 'student', 
    password: password 
  };
  
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return newUser;
};

export const getAllStudents = (): User[] => {
  const users = getUsers();
  return users.filter((u: any) => u.role === 'student');
};

export const deleteStudent = (username: string) => {
  const users = getUsers();
  const newUsers = users.filter((u: any) => u.username !== username);
  localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
};

export const loginUser = (username: string, password: string, role: 'student' | 'admin'): User => {
  if (role === 'admin') {
    const admin = getAdminCredentials();
    if (username.toLowerCase() === admin.username.toLowerCase() && password === admin.password) {
      const user: User = { username, role: 'admin', fullName: 'System Administrator' };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    }
    throw new Error('Invalid Admin Credentials');
  } else {
    // Student Login
    const users = getUsers();
    const cleanUsername = username.trim().toUpperCase();
    
    const user = users.find((u: any) => u.username === cleanUsername && u.password === password);
    
    if (user) {
      const sessionUser: User = { 
        username: user.username, 
        role: 'student', 
        fullName: user.fullName, 
        regNumber: user.regNumber 
      };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
      return sessionUser;
    }
    throw new Error('Invalid Reg Number or Password. Contact Admin.');
  }
};

export const changePassword = (username: string, oldPass: string, newPass: string, role: 'student' | 'admin') => {
  if (role === 'admin') {
    const admin = getAdminCredentials();
    if (admin.password !== oldPass) {
      throw new Error("Incorrect current password");
    }
    const newConfig = { ...admin, password: newPass };
    localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(newConfig));
  } else {
    const users = getUsers();
    const userIndex = users.findIndex((u: any) => u.username === username);
    if (userIndex === -1) throw new Error("User not found");
    
    if (users[userIndex].password !== oldPass) {
      throw new Error("Incorrect current password");
    }
    
    users[userIndex].password = newPass;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
};

export const resetAdminPassword = (newPass: string) => {
  const admin = getAdminCredentials();
  const newConfig = { ...admin, password: newPass };
  localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(newConfig));
};

export const logoutUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  return stored ? JSON.parse(stored) : null;
};
