import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, LogOut, LayoutDashboard, Wand2, Loader2, Book, Edit3, Hash, Users, BrainCircuit, Search, GraduationCap } from 'lucide-react';
import { Lesson, Exercise, User } from '../types';
import { generateLessonContent, analyzeLearnerProfile } from '../services/geminiService';
import { storageService } from '../services/storage';

interface AdminPanelProps {
  lessons: Lesson[];
  onAddLesson: (lesson: Lesson) => void;
  onUpdateLesson: (lesson: Lesson) => void;
  onDeleteLesson: (id: string) => void;
  onBack: () => void; // Used to switch to Learner View
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  lessons, 
  onAddLesson, 
  onUpdateLesson,
  onDeleteLesson, 
  onBack,
  onLogout
}) => {
  // Tabs
  const [activeTab, setActiveTab] = useState<'lessons' | 'users'>('lessons');

  // User Data
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [analyzingUserId, setAnalyzingUserId] = useState<string | null>(null);

  // Lesson View State
  const [viewingLessonId, setViewingLessonId] = useState<string | null>(null);

  // Generation State
  const [prompt, setPrompt] = useState('');
  const [generationCount, setGenerationCount] = useState<number | 'auto'>('auto');
  const [isGenerating, setIsGenerating] = useState(false);

  // Manual Exercise State
  const [newExercise, setNewExercise] = useState<Partial<Exercise>>({
      difficulty: 'Medium',
      vietnamese: '',
      hint: ''
  });

  useEffect(() => {
      loadUsers();
  }, []);

  const loadUsers = () => {
      setUsers(storageService.getUsers().filter(u => u.role === 'learner'));
  };

  const handleGenerateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
        const generatedContent = await generateLessonContent(prompt, generationCount);
        
        const newLesson: Lesson = {
            id: `lesson-${Date.now()}`,
            ...generatedContent,
            exercises: generatedContent.exercises.map((ex, idx) => ({
                id: Date.now() + idx,
                ...ex,
                difficulty: ex.difficulty as 'Easy' | 'Medium' | 'Hard'
            }))
        };

        onAddLesson(newLesson);
        setPrompt('');
        alert(`Đã tạo bài học thành công! Gồm ${newLesson.exercises.length} câu hỏi.`);
    } catch (err) {
        console.error(err);
        alert('Có lỗi khi tạo bài học. Vui lòng thử lại.');
    } finally {
        setIsGenerating(false);
    }
  };

  const handleAnalyzeUser = async (user: User) => {
      if (user.history.length === 0) {
          alert('Học viên này chưa có lịch sử học tập.');
          return;
      }
      setAnalyzingUserId(user.id);
      try {
          const profile = await analyzeLearnerProfile(user.history);
          storageService.updateAnalysis(user.id, profile);
          loadUsers(); // Refresh to show new data
          if (selectedUser?.id === user.id) {
              setSelectedUser({...user, lastAnalysis: profile});
          }
      } catch (err) {
          console.error(err);
          alert('Không thể phân tích dữ liệu.');
      } finally {
          setAnalyzingUserId(null);
      }
  };

  // --- Exercise Management Logic ---
  const handleAddManualExercise = () => {
      if (!viewingLessonId || !newExercise.vietnamese) return;
      const currentLesson = lessons.find(l => l.id === viewingLessonId);
      if (!currentLesson) return;
      const exerciseToAdd: Exercise = {
          id: Date.now(),
          vietnamese: newExercise.vietnamese,
          hint: newExercise.hint || undefined,
          difficulty: newExercise.difficulty as 'Easy' | 'Medium' | 'Hard'
      };
      const updatedLesson = { ...currentLesson, exercises: [...currentLesson.exercises, exerciseToAdd] };
      onUpdateLesson(updatedLesson);
      setNewExercise({ difficulty: 'Medium', vietnamese: '', hint: '' });
  };

  const handleDeleteExercise = (exerciseId: number) => {
      if (!viewingLessonId) return;
      const currentLesson = lessons.find(l => l.id === viewingLessonId);
      if (!currentLesson) return;
      const updatedLesson = { ...currentLesson, exercises: currentLesson.exercises.filter(ex => ex.id !== exerciseId) };
      onUpdateLesson(updatedLesson);
  };

  // --- RENDER CONTENT ---
  
  // 1. LESSON DETAIL VIEW
  if (viewingLessonId) {
      const lesson = lessons.find(l => l.id === viewingLessonId);
      if (!lesson) return null;
      return (
        <div className="min-h-screen bg-slate-50 font-sans p-6 md:p-8">
            <div className="max-w-5xl mx-auto">
                <button onClick={() => setViewingLessonId(null)} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold mb-6 transition-colors">
                    <ArrowLeft className="w-5 h-5" /> Quay lại danh sách
                </button>
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded mb-2 inline-block ${lesson.level === 'Beginner' ? 'bg-emerald-100 text-emerald-700' : lesson.level === 'Intermediate' ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'}`}>{lesson.level}</span>
                        <h1 className="text-3xl font-heading font-extrabold text-slate-900">{lesson.title}</h1>
                        <p className="text-slate-500 mt-2">{lesson.description}</p>
                    </div>
                    <div className="p-8">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Book className="w-5 h-5 text-indigo-500" /> Danh sách câu hỏi ({lesson.exercises.length})</h3>
                        <div className="space-y-3 mb-8">
                            {lesson.exercises.map((ex, idx) => (
                                <div key={ex.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-slate-400 text-sm shadow-sm border border-slate-100">{idx + 1}</div>
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-800 text-lg">{ex.vietnamese}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${ex.difficulty === 'Easy' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : ex.difficulty === 'Medium' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>{ex.difficulty}</span>
                                            {ex.hint && <span className="text-xs text-slate-400 italic">Hint: {ex.hint}</span>}
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteExercise(ex.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-5 h-5" /></button>
                                </div>
                            ))}
                        </div>
                        <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                            <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-wider mb-4 flex items-center gap-2"><Plus className="w-4 h-4" /> Thêm câu hỏi thủ công</h3>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-6"><input type="text" placeholder="Câu Tiếng Việt..." className="w-full p-3 rounded-xl border border-indigo-200 focus:ring-2 outline-none" value={newExercise.vietnamese} onChange={(e) => setNewExercise({...newExercise, vietnamese: e.target.value})} /></div>
                                <div className="md:col-span-4"><input type="text" placeholder="Gợi ý (Hint)..." className="w-full p-3 rounded-xl border border-indigo-200 focus:ring-2 outline-none" value={newExercise.hint} onChange={(e) => setNewExercise({...newExercise, hint: e.target.value})} /></div>
                                <div className="md:col-span-2"><select className="w-full p-3 rounded-xl border border-indigo-200 bg-white" value={newExercise.difficulty} onChange={(e) => setNewExercise({...newExercise, difficulty: e.target.value as any})}><option value="Easy">Dễ</option><option value="Medium">Vừa</option><option value="Hard">Khó</option></select></div>
                            </div>
                            <button onClick={handleAddManualExercise} disabled={!newExercise.vietnamese} className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md disabled:opacity-50">Lưu câu hỏi này</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // --- DASHBOARD LAYOUT ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="bg-white border-b md:border-b-0 md:border-r border-slate-200 w-full md:w-72 p-6 flex flex-col gap-6 sticky top-0 h-auto md:h-screen z-10">
         <div className="flex items-center gap-3 text-indigo-700">
            <div className="bg-indigo-100 p-2 rounded-lg"><LayoutDashboard className="w-6 h-6" /></div>
            <span className="font-heading font-extrabold text-xl">Admin</span>
         </div>
         <nav className="flex-1 space-y-2">
            <button onClick={() => setActiveTab('lessons')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'lessons' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>
               <Book className="w-5 h-5" /> Bài học
            </button>
            <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'users' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>
               <Users className="w-5 h-5" /> Học viên
            </button>
         </nav>
         <div className="space-y-2 pt-6 border-t border-slate-100">
            <button onClick={onBack} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 rounded-xl font-bold transition-colors">
              <GraduationCap className="w-5 h-5" /> Giao diện học viên
            </button>
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition-colors">
              <LogOut className="w-5 h-5" /> Đăng xuất
            </button>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto">
        <header className="mb-8">
            <h1 className="text-3xl font-heading font-extrabold text-slate-900">{activeTab === 'lessons' ? 'Quản lý bài học' : 'Quản lý học viên'}</h1>
        </header>

        {activeTab === 'lessons' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Generator */}
          <div className="xl:col-span-1">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 sticky top-6">
               <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl mb-6 text-white relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-20"><Wand2 className="w-24 h-24" /></div>
                   <h3 className="text-xl font-heading font-bold mb-2 relative z-10">AI Lesson Generator</h3>
                   <form onSubmit={handleGenerateLesson}>
                       <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} disabled={isGenerating} placeholder="Nhập chủ đề..." className="w-full bg-white/20 border border-white/30 rounded-xl p-3 text-white placeholder:text-indigo-200 outline-none focus:bg-white/30 resize-none h-20 mb-3 text-sm" />
                       <div className="mb-3 relative">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-indigo-200"><Hash className="w-4 h-4" /></div>
                           <select value={generationCount} onChange={(e) => setGenerationCount(e.target.value === 'auto' ? 'auto' : Number(e.target.value))} className="w-full bg-white/20 border border-white/30 rounded-xl py-2 pl-9 pr-3 text-white text-sm outline-none cursor-pointer appearance-none">
                                <option value="auto" className="text-slate-900">Tự động</option>
                                <option value="5" className="text-slate-900">5 câu</option>
                                <option value="10" className="text-slate-900">10 câu</option>
                                <option value="15" className="text-slate-900">15 câu</option>
                           </select>
                       </div>
                       <button type="submit" disabled={isGenerating || !prompt.trim()} className="w-full bg-white text-indigo-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-50 disabled:opacity-50">
                           {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                           {isGenerating ? 'Đang tạo...' : 'Tạo ngay'}
                       </button>
                   </form>
               </div>
            </div>
          </div>
          {/* Lesson List */}
          <div className="xl:col-span-2 space-y-4">
              {lessons.map((lesson) => (
                  <div key={lesson.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-6 group hover:border-indigo-500 transition-colors">
                      <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex-shrink-0 flex items-center justify-center font-bold text-xl">{lesson.title.charAt(0)}</div>
                      <div className="flex-1 cursor-pointer" onClick={() => setViewingLessonId(lesson.id)}>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${lesson.level === 'Beginner' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>{lesson.level}</span>
                          <h3 className="text-xl font-heading font-bold text-slate-800 mt-1">{lesson.title}</h3>
                          <p className="text-slate-500 text-sm line-clamp-1">{lesson.exercises.length} câu hỏi</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setViewingLessonId(lesson.id)} className="p-3 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl"><Edit3 className="w-5 h-5" /></button>
                        <button onClick={() => onDeleteLesson(lesson.id)} className="p-3 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl"><Trash2 className="w-5 h-5" /></button>
                      </div>
                  </div>
              ))}
          </div>
        </div>
        ) : (
            // USERS TAB
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User List */}
                <div className="space-y-4">
                    {users.map(user => (
                        <div 
                            key={user.id} 
                            onClick={() => setSelectedUser(user)}
                            className={`p-6 rounded-3xl border cursor-pointer transition-all flex items-center justify-between
                            ${selectedUser?.id === user.id ? 'bg-indigo-50 border-indigo-500 shadow-md' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500">
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">{user.username}</h3>
                                    <p className="text-sm text-slate-500">Đã làm {user.history.length} bài tập</p>
                                </div>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleAnalyzeUser(user); }}
                                disabled={analyzingUserId === user.id}
                                className="p-2 rounded-xl bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50"
                            >
                                {analyzingUserId === user.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
                            </button>
                        </div>
                    ))}
                    {users.length === 0 && <p className="text-slate-500">Chưa có học viên nào.</p>}
                </div>

                {/* User Details */}
                <div className="bg-white rounded-3xl border border-slate-200 p-8 h-fit sticky top-6">
                    {selectedUser ? (
                        <div className="animate-fade-in">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-heading font-extrabold text-slate-900">{selectedUser.username}</h2>
                                    <p className="text-slate-500">Hồ sơ năng lực</p>
                                </div>
                                {selectedUser.lastAnalysis && (
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                        ${selectedUser.lastAnalysis.recentProgress === 'Improving' ? 'bg-emerald-100 text-emerald-700' :
                                          selectedUser.lastAnalysis.recentProgress === 'Stable' ? 'bg-blue-100 text-blue-700' :
                                          'bg-orange-100 text-orange-700'}`}>
                                        {selectedUser.lastAnalysis.recentProgress}
                                    </div>
                                )}
                            </div>

                            {selectedUser.lastAnalysis ? (
                                <div className="space-y-6">
                                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                                        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Tổng quan từ AI</h4>
                                        <p className="text-indigo-900 italic">"{selectedUser.lastAnalysis.summary}"</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Điểm mạnh</h4>
                                            <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                                                {selectedUser.lastAnalysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                            </ul>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider">Điểm yếu</h4>
                                            <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                                                {selectedUser.lastAnalysis.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                                            </ul>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">Gợi ý lộ trình</h4>
                                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-amber-900 text-sm font-medium">
                                            {selectedUser.lastAnalysis.suggestedFocus}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-400">
                                    <BrainCircuit className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>Chưa có dữ liệu phân tích.</p>
                                    <button 
                                        onClick={() => handleAnalyzeUser(selectedUser)}
                                        className="mt-4 text-indigo-600 font-bold text-sm hover:underline"
                                    >
                                        Chạy phân tích ngay
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-slate-400">
                            <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Chọn một học viên để xem chi tiết</p>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};