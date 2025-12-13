import React, { useState, useRef, useEffect } from 'react';
import { Loader2, RefreshCw, Trophy, Settings, Flag, ArrowRight, Book, Star, ChevronLeft, LogOut, Mic, X } from 'lucide-react';
import { AppState, EvaluationResult, Lesson, User, HistoryEntry } from '../types';
import { evaluateTranslation } from '../services/geminiService';
import { GeminiLiveService } from '../services/geminiLive';
import { storageService } from '../services/storage';
import { ProgressBar } from './ProgressBar';
import { FeedbackCard } from './FeedbackCard';

interface LearnerViewProps {
  lessons: Lesson[];
  currentUser: User;
  onOpenAdmin?: () => void;
  onLogout: () => void;
}

export const LearnerView: React.FC<LearnerViewProps> = ({ lessons, currentUser, onOpenAdmin, onLogout }) => {
  // Navigation State
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  
  // Exercise State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [feedback, setFeedback] = useState<EvaluationResult | null>(null);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Live Session State
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0);
  const liveServiceRef = useRef<GeminiLiveService | null>(null);

  // Reset state when entering a lesson
  useEffect(() => {
    if (selectedLesson) {
      setCurrentIndex(0);
      setUserInput('');
      setFeedback(null);
      setAppState(AppState.IDLE);
      setIsLiveActive(false);
    }
  }, [selectedLesson]);

  const currentExercise = selectedLesson ? selectedLesson.exercises[currentIndex] : null;
  const isLastQuestion = selectedLesson ? currentIndex === selectedLesson.exercises.length - 1 : false;

  useEffect(() => {
    if (appState === AppState.IDLE && inputRef.current) {
      inputRef.current.focus();
    }
  }, [appState, currentIndex]);

  const handleCheck = async () => {
    if (!userInput.trim() || !currentExercise || !selectedLesson) return;

    setAppState(AppState.EVALUATING);
    
    try {
      const result = await evaluateTranslation(currentExercise.vietnamese, userInput);
      setFeedback(result);
      setAppState(AppState.FEEDBACK);

      // Save History using storage service
      const historyEntry: HistoryEntry = {
          id: `h-${Date.now()}`,
          timestamp: Date.now(),
          lessonId: selectedLesson.id,
          exerciseId: currentExercise.id,
          question: currentExercise.vietnamese,
          userAnswer: userInput,
          score: result.score,
          errorTypes: result.detailedAnalysis.filter(t => t.status === 'error').map(t => t.errorType || 'Unknown')
      };
      
      storageService.addHistory(currentUser.id, historyEntry);

    } catch (error) {
      console.error(error);
      setAppState(AppState.ERROR);
    }
  };

  const handleNext = () => {
    finishQuestion();
  };

  const finishQuestion = () => {
     if (isLastQuestion) {
      setAppState(AppState.COMPLETED);
    } else {
      setCurrentIndex(prev => prev + 1);
      setUserInput('');
      setFeedback(null);
      setAppState(AppState.IDLE);
    }
  };

  const handleRetry = () => {
    setAppState(AppState.IDLE);
    setFeedback(null);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleBackToMenu = () => {
    setSelectedLesson(null);
    setAppState(AppState.IDLE);
    stopLiveSession();
  };

  // --- LIVE SESSION HANDLERS ---
  const startLiveSession = async () => {
      if (!feedback?.correction) return;
      
      setIsLiveActive(true);
      liveServiceRef.current = new GeminiLiveService();
      
      liveServiceRef.current.onAudioData = (volume) => {
          setAudioVolume(Math.min(100, volume * 500)); // Normalize volume for visualizer
      };
      
      liveServiceRef.current.onError = (msg) => {
          alert(msg);
          stopLiveSession();
      };

      await liveServiceRef.current.connect(feedback.correction);
  };

  const stopLiveSession = async () => {
      if (liveServiceRef.current) {
          await liveServiceRef.current.disconnect();
          liveServiceRef.current = null;
      }
      setIsLiveActive(false);
      setAudioVolume(0);
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- RENDER: LESSON MENU ---
  if (!selectedLesson) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] font-sans">
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20 shadow-sm">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 rounded-xl p-2 shadow-lg shadow-indigo-200">
                  <Flag className="w-6 h-6 text-white fill-current" />
              </div>
              <div>
                <h1 className="font-heading font-extrabold text-2xl text-slate-800">EngPractice AI</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Xin chào, {currentUser.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
                {onOpenAdmin && (
                    <button onClick={onOpenAdmin} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all">
                    <Settings className="w-5 h-5" />
                    <span className="hidden sm:inline">Admin</span>
                    </button>
                )}
                <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold transition-all">
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto p-6 pb-20">
          <div className="mb-8">
            <h2 className="text-3xl font-heading font-extrabold text-slate-800 mb-2">Chọn bài học</h2>
            <p className="text-slate-500 font-medium">Các bài học được thiết kế khoa học để nâng cao kỹ năng của bạn.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.length === 0 ? (
               <div className="col-span-full text-center p-12 bg-white rounded-3xl border border-slate-200">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Book className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700">Chưa có bài học nào</h3>
                  <p className="text-slate-500 mt-2">Vui lòng vào trang Admin để tạo bài học mới.</p>
               </div>
            ) : (
              lessons.map((lesson) => (
                <div 
                  key={lesson.id}
                  onClick={() => setSelectedLesson(lesson)}
                  className="bg-white rounded-3xl p-6 shadow-sm border-2 border-slate-100 hover:border-indigo-500 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 px-3 py-1.5 rounded-bl-2xl text-xs font-bold uppercase tracking-wider
                    ${lesson.level === 'Beginner' ? 'bg-emerald-100 text-emerald-700' :
                      lesson.level === 'Intermediate' ? 'bg-indigo-100 text-indigo-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                    {lesson.level}
                  </div>

                  <div className="mb-4 mt-2">
                     <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Book className="w-6 h-6 text-indigo-600" />
                     </div>
                     <h3 className="text-xl font-heading font-extrabold text-slate-800 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                       {lesson.title}
                     </h3>
                     <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">
                       {lesson.description}
                     </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
                     <div className="flex items-center gap-1 text-slate-400 text-sm font-bold">
                        <Star className="w-4 h-4 text-amber-400 fill-current" />
                        <span>{lesson.exercises.length} câu hỏi</span>
                     </div>
                     <span className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <ArrowRight className="w-4 h-4" />
                     </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    );
  }

  // --- RENDER: EXERCISE FLOW ---

  if (appState === AppState.COMPLETED) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center space-y-6 animate-slide-up border border-slate-100">
          <div className="w-32 h-32 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Trophy className="w-16 h-16 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-extrabold text-slate-800 mb-2">Hoàn thành bài học!</h1>
            <p className="text-slate-600 font-medium">Bạn đã hoàn thành bài: {selectedLesson.title}</p>
          </div>
          <button onClick={handleBackToMenu} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-heading font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
            <RefreshCw className="w-5 h-5" /> VỀ DANH SÁCH BÀI HỌC
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans flex flex-col relative">
      
      {/* --- LIVE OVERLAY --- */}
      {isLiveActive && feedback && (
          <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-fade-in">
              <div className="w-full max-w-lg text-center space-y-8">
                  <div className="space-y-4">
                      <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-indigo-500/30">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                          Live Coach
                      </div>
                      <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-white leading-tight">
                          {feedback.correction}
                      </h2>
                      <p className="text-slate-400 font-medium">Hãy nói theo hướng dẫn của AI</p>
                  </div>

                  {/* VISUALIZER */}
                  <div className="h-32 flex items-center justify-center gap-1 sm:gap-2">
                      {[...Array(8)].map((_, i) => (
                          <div 
                             key={i} 
                             className="w-3 sm:w-4 bg-gradient-to-t from-indigo-500 to-cyan-400 rounded-full transition-all duration-75 ease-out"
                             style={{ 
                                 height: `${Math.max(10, Math.random() * audioVolume + 10)}%`,
                                 opacity: 0.8
                             }}
                          ></div>
                      ))}
                  </div>

                  <button 
                      onClick={stopLiveSession}
                      className="group relative inline-flex items-center justify-center gap-3 bg-rose-600 hover:bg-rose-700 text-white font-heading font-bold py-4 px-8 rounded-2xl transition-all shadow-[0_0_30px_rgba(225,29,72,0.4)]"
                  >
                      <X className="w-6 h-6" />
                      Kết thúc luyện tập
                  </button>
              </div>
          </div>
      )}

      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={handleBackToMenu} className="p-2 -ml-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition-colors flex items-center gap-2">
             <ChevronLeft className="w-6 h-6" />
             <span className="font-bold text-sm hidden sm:inline">Thoát</span>
          </button>
          
          <div className="flex flex-col items-center">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedLesson.title}</span>
             <div className="flex items-center gap-2">
               <span className="font-heading font-extrabold text-slate-700">Câu {currentIndex + 1}/{selectedLesson.exercises.length}</span>
             </div>
          </div>

          <div className="w-10"></div> {/* Spacer for center alignment */}
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto p-4 sm:p-6 pb-28">
        <ProgressBar current={currentIndex} total={selectedLesson.exercises.length} />

          {currentExercise && (
            <>
            <div className="bg-white rounded-3xl shadow-sm border-2 border-slate-100 p-6 sm:p-8 mb-6 relative overflow-visible transition-all duration-300">
              {appState !== AppState.FEEDBACK && (
                  <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500 rounded-l-3xl"></div>
              )}
              
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                    ${currentExercise.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-700' : 
                      currentExercise.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-rose-100 text-rose-700'}`}>
                    {currentExercise.difficulty}
                  </span>
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-800 leading-tight">
                  {currentExercise.vietnamese}
                </h2>
                
                {currentExercise.hint && (
                  <div className="mt-4 flex items-start gap-2 text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-wider bg-slate-200 px-2 py-0.5 rounded text-slate-600">Hint</span>
                    <p className="text-sm italic">{currentExercise.hint}</p>
                  </div>
                )}
              </div>

              <div className="relative group">
                {appState === AppState.FEEDBACK && feedback ? (
                  /* VISUALIZATION */
                  <div className="w-full bg-white px-2 py-4 rounded-2xl">
                     <div className="flex flex-wrap items-end gap-x-2 gap-y-12 leading-loose">
                        {feedback.detailedAnalysis.map((segment, idx) => {
                           if (segment.status === 'error') {
                               return (
                                   <div key={idx} className="relative group/error">
                                       <span className="absolute -top-6 left-1/2 -translate-x-1/2 w-max bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10 uppercase tracking-wider border-2 border-white">
                                           {segment.errorType || "Sửa lỗi"}
                                       </span>
                                       
                                       <div className="flex flex-col items-center bg-rose-50 border-b-2 border-rose-200 rounded-lg px-3 py-1.5 min-w-[3rem]">
                                           <span className="text-xs text-rose-400 line-through decoration-rose-400/50 mb-0.5 select-none font-medium">
                                               {segment.text}
                                           </span>
                                           
                                           <span className="text-lg text-emerald-600 font-bold cursor-pointer hover:underline decoration-emerald-300 decoration-2 underline-offset-4"
                                                 onClick={() => speakText(segment.correction || '')}
                                                 title="Click to listen">
                                               {segment.correction}
                                           </span>
                                       </div>
                                   </div>
                               );
                           } else {
                               return (
                                   <span key={idx} className="text-xl text-slate-700 font-medium py-2">
                                       {segment.text}
                                   </span>
                               );
                           }
                        })}
                     </div>
                  </div>
                ) : (
                  <textarea
                    ref={inputRef}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    disabled={appState !== AppState.IDLE}
                    placeholder="Nhập câu trả lời bằng tiếng Anh..."
                    spellCheck={false}
                    className={`w-full h-32 p-5 text-xl font-medium bg-slate-50 border-2 rounded-2xl transition-all duration-200 resize-none outline-none
                      ${appState === AppState.IDLE ? 'border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-slate-800' : 'border-transparent bg-slate-100 text-slate-500'}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (appState === AppState.IDLE) {
                          handleCheck();
                        }
                      }
                    }}
                  />
                )}
              </div>
            </div>

            {(appState === AppState.FEEDBACK) && feedback && (
              <FeedbackCard result={feedback} onNext={handleNext} isLastQuestion={isLastQuestion} />
            )}
            
            {appState === AppState.ERROR && (
              <div className="mt-4 p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-center font-medium animate-fade-in">
                Có lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.
              </div>
            )}
            </>
          )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 pb-6 z-20">
        <div className="max-w-2xl mx-auto flex gap-4">
            {appState === AppState.FEEDBACK && (
            <>
            {!feedback?.isPass && (
                <button onClick={handleRetry} className="flex-1 bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 font-heading font-bold py-3.5 px-6 rounded-2xl transition-all uppercase tracking-wide">Thử lại</button>
            )}
            {!feedback?.isPass ? (
                <button onClick={finishQuestion} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-heading font-bold py-3.5 px-6 rounded-2xl transition-all uppercase tracking-wide">Bỏ qua</button>
            ) : (
                <div className="flex w-full gap-3">
                   {/* AI PRONUNCIATION BUTTON */}
                   <button 
                      onClick={startLiveSession}
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-heading font-bold py-4 px-4 rounded-2xl transition-all shadow-[0_4px_0_0_#312e81] hover:shadow-[0_2px_0_0_#312e81] hover:translate-y-[2px]"
                   >
                       <Mic className="w-5 h-5" /> Luyện phát âm AI
                   </button>
                   
                   <button 
                      onClick={finishQuestion} 
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-heading font-bold py-4 px-4 rounded-2xl transition-all shadow-[0_4px_0_0_#059669] hover:shadow-[0_2px_0_0_#059669] hover:translate-y-[2px]"
                   >
                       {isLastQuestion ? 'Hoàn thành' : 'Tiếp tục'} <ArrowRight className="w-5 h-5" />
                   </button>
                </div>
            )}
            </>
            )}
            {(appState === AppState.IDLE || appState === AppState.EVALUATING) && (
                <button onClick={handleCheck} disabled={!userInput.trim() || appState === AppState.EVALUATING} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-heading font-bold py-3.5 px-6 rounded-2xl transition-all shadow-[0_4px_0_0_#4338ca] flex items-center justify-center gap-2 uppercase tracking-wide">
                {appState === AppState.EVALUATING ? <><Loader2 className="w-5 h-5 animate-spin" /> Đang kiểm tra...</> : 'KIỂM TRA'}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};