import { User, HistoryEntry, LearnerProfile } from "../types";

const USERS_KEY = 'eng_app_users';
const CURRENT_USER_KEY = 'eng_app_current_user';

// Mock initial data
const INITIAL_USERS: User[] = [
  {
    id: 'admin',
    username: 'admin',
    password: '123',
    role: 'admin',
    history: []
  },
  {
    id: 'user',
    username: 'user',
    password: '123',
    role: 'learner',
    history: [
        { id: 'h1', timestamp: Date.now() - 86400000, lessonId: 'lesson-1', exerciseId: 101, question: 'Test 1', userAnswer: 'Test', score: 60, errorTypes: ['Sai thì'] },
        { id: 'h2', timestamp: Date.now(), lessonId: 'lesson-1', exerciseId: 102, question: 'Test 2', userAnswer: 'Test', score: 90, errorTypes: [] }
    ]
  }
];

export const storageService = {
  getUsers: (): User[] => {
    const stored = localStorage.getItem(USERS_KEY);
    if (!stored) {
        localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
        return INITIAL_USERS;
    }
    return JSON.parse(stored);
  },

  saveUsers: (users: User[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  login: (username: string, password: string): User | null => {
    // Reset to initial users if needed for testing specific credentials requested
    const stored = localStorage.getItem(USERS_KEY);
    let users = stored ? JSON.parse(stored) : INITIAL_USERS;
    
    // Ensure 'user' exists if local storage is old
    if (!users.find((u: User) => u.username === 'user')) {
        users = INITIAL_USERS;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    const user = users.find((u: User) => u.username === username && u.password === password);
    if (user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        return user;
    }
    return null;
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  register: (username: string, password: string): User | null => {
      const users = storageService.getUsers();
      if (users.find(u => u.username === username)) return null;

      const newUser: User = {
          id: `user-${Date.now()}`,
          username,
          password,
          role: 'learner',
          history: []
      };

      users.push(newUser);
      storageService.saveUsers(users);
      return newUser;
  },

  addHistory: (userId: string, entry: HistoryEntry) => {
      const users = storageService.getUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
          users[userIndex].history.unshift(entry); // Add to top
          storageService.saveUsers(users);
          
          // Update current session user if needed
          const currentUser = storageService.getCurrentUser();
          if (currentUser && currentUser.id === userId) {
             currentUser.history.unshift(entry);
             localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
          }
      }
  },

  updateAnalysis: (userId: string, profile: LearnerProfile) => {
      const users = storageService.getUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
          users[userIndex].lastAnalysis = profile;
          storageService.saveUsers(users);
      }
  }
};