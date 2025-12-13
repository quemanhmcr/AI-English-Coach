import React from 'react';
import { CheckCircle2, XCircle, Lightbulb, ArrowRight, Briefcase, Coffee, Sparkles, Star, Zap, BookOpen, Volume2 } from 'lucide-react';
import { EvaluationResult } from '../types';

interface FeedbackCardProps {
  result: EvaluationResult;
  onNext: () => void;
  isLastQuestion: boolean;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({ result, onNext, isLastQuestion }) => {
  const isPass = result.isPass;

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };
  
  return (
    <div className={`mt-6 rounded-3xl overflow-hidden border-2 animate-slide-up shadow-sm bg-white ${
      isPass ? 'border-emerald-100' : 'border-rose-100'
    }`}>
      {/* Header Status */}
      <div className={`p-5 flex items-center gap-4 border-b ${
        isPass ? 'border-emerald-100 bg-emerald-50' : 'border-rose-100 bg-rose-50'
      }`}>
        <div className={`p-2 rounded-full ${isPass ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          {isPass ? (
            <CheckCircle2 className="w-6 h-6 text-white" />
          ) : (
            <XCircle className="w-6 h-6 text-white" />
          )}
        </div>
        <div>
          <h3 className={`font-heading font-bold text-xl ${isPass ? 'text-emerald-900' : 'text-rose-900'}`}>
            {isPass ? 'Tuyệt vời! Chính xác' : 'Chưa chính xác'}
          </h3>
          <p className={`text-sm font-semibold ${isPass ? 'text-emerald-700' : 'text-rose-700'}`}>
            Điểm chấm: {result.score}/100
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Key Takeaway (Golden Rule) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-100 p-4">
           <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
           <div className="flex gap-3">
              <div className="p-2 bg-orange-100 rounded-lg h-fit">
                 <Zap className="w-5 h-5 text-orange-600 fill-current" />
              </div>
              <div>
                 <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wider mb-1">Bài học rút gọn</h4>
                 <p className="text-slate-800 font-bold text-sm leading-relaxed">{result.keyTakeaway}</p>
              </div>
           </div>
        </div>

        {/* AI Explanation & Correction */}
        <div className="space-y-3">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
             <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" /> Đáp án chuẩn & Giải thích
             </h4>
            <div className="flex items-center gap-2 mb-2">
                <p className="text-slate-900 font-medium text-lg flex-1">{result.correction}</p>
                <button 
                    onClick={() => speakText(result.correction)}
                    className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors"
                >
                    <Volume2 className="w-5 h-5" />
                </button>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed border-t border-slate-200 pt-2 mt-2">
               {result.explanation}
            </p>
          </div>
        </div>

        {/* Vocabulary Expansion */}
        {result.relatedVocabulary && result.relatedVocabulary.length > 0 && (
            <div className="space-y-3">
                <h4 className="text-xs font-bold text-teal-600 uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Từ vựng nên biết (Mở rộng)
                </h4>
                <div className="grid grid-cols-1 gap-3">
                    {result.relatedVocabulary.map((item, idx) => (
                        <div key={idx} className="bg-teal-50 border border-teal-100 rounded-xl p-3 flex items-start gap-3">
                            <div className="bg-white px-2 py-1 rounded text-xs font-bold text-teal-700 shadow-sm border border-teal-100 whitespace-nowrap">
                                {item.type}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-teal-900">{item.word}</span>
                                    <span className="text-teal-600 text-sm">- {item.meaning}</span>
                                </div>
                                <p className="text-slate-500 text-xs italic mt-1">Example: "{item.example}"</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Practical Alternatives - The "Smart" Feature */}
        {result.alternatives && result.alternatives.length > 0 && (
          <div className="space-y-3">
             <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-2">
               <Star className="w-4 h-4" /> Ứng dụng thực tế (Nói sao cho chất?)
             </h4>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {result.alternatives.map((alt, idx) => (
                   <div key={idx} className="flex flex-col bg-white border border-slate-200 rounded-xl p-3 hover:shadow-md transition-shadow relative group">
                      <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center gap-2">
                            {alt.type === 'Formal' && <Briefcase className="w-3 h-3 text-slate-500" />}
                            {alt.type === 'Casual' && <Coffee className="w-3 h-3 text-amber-600" />}
                            {alt.type === 'Native' && <Sparkles className="w-3 h-3 text-purple-600" />}
                            <span className={`text-[10px] font-bold uppercase tracking-widest
                                ${alt.type === 'Formal' ? 'text-slate-500' : 
                                alt.type === 'Casual' ? 'text-amber-600' : 'text-purple-600'
                                }`}>
                                {alt.type}
                            </span>
                         </div>
                         <button 
                            onClick={(e) => { e.stopPropagation(); speakText(alt.text); }}
                            className="text-slate-300 hover:text-indigo-500 transition-colors"
                         >
                            <Volume2 className="w-4 h-4" />
                         </button>
                      </div>
                      <p className="text-slate-800 font-medium text-sm mb-2 flex-grow">{alt.text}</p>
                      <p className="text-xs text-slate-400">{alt.context}</p>
                   </div>
                ))}
             </div>
          </div>
        )}

      </div>

      {/* Action Button */}
      {isPass && (
        <div className="p-4 bg-white border-t border-slate-100">
          <button
            onClick={onNext}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-heading font-bold py-4 px-6 rounded-2xl transition-all shadow-[0_4px_0_0_#059669] hover:shadow-[0_2px_0_0_#059669] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]"
          >
            {isLastQuestion ? 'HOÀN THÀNH' : 'TIẾP TỤC'} <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
      
      {!isPass && (
        <div className="p-4 bg-rose-50 text-center border-t border-rose-100">
          <p className="text-rose-600 font-semibold text-sm">
            Hãy thử lại để đạt trên 80 điểm nhé!
          </p>
        </div>
      )}
    </div>
  );
};