import React, { useState, useEffect } from 'react';
import { INITIAL_LESSONS } from './constants';
import { Lesson, User } from './types';
import { LearnerView } from './components/LearnerView';
import { AdminPanel } from './components/AdminPanel';
import { LoginScreen } from './components/LoginScreen';
import { storageService } from './services/storage';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'learner' | 'admin'>('learner');
  const [lessons, setLessons] = useState<Lesson[]>(INITIAL_LESSONS);

  useEffect(() => {
    // Check for persisted session
    const user = storageService.getCurrentUser();
    if (user) {
        setCurrentUser(user);
        setView(user.role === 'admin' ? 'admin' : 'learner');
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setView(user.role === 'admin' ? 'admin' : 'learner');
  };

  const handleLogout = () => {
    storageService.logout();
    setCurrentUser(null);
  };

  const handleAddLesson = (newLesson: Lesson) => {
    setLessons(prev => [newLesson, ...prev]);
  };

  const handleUpdateLesson = (updatedLesson: Lesson) => {
    setLessons(prev => prev.map(l => l.id === updatedLesson.id ? updatedLesson : l));
  };

  const handleDeleteLesson = (lessonId: string) => {
    setLessons(prev => prev.filter(l => l.id !== lessonId));
  };

  if (!currentUser) {
      return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <>
      {view === 'learner' ? (
        <LearnerView 
          lessons={lessons} 
          currentUser={currentUser}
          onOpenAdmin={currentUser.role === 'admin' ? () => setView('admin') : undefined}
          onLogout={handleLogout}
        />
      ) : (
        <AdminPanel 
          lessons={lessons}
          onAddLesson={handleAddLesson}
          onUpdateLesson={handleUpdateLesson}
          onDeleteLesson={handleDeleteLesson}
          onBack={() => setView('learner')}
          onLogout={handleLogout}
        />
      )}
    </>
  );
};

export default App;