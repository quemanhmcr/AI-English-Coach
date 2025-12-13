import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  const percentage = Math.min(100, (current / total) * 100);

  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <div className="flex justify-between text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
        <span>Start</span>
        <span>Level {current + 1}</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-4 shadow-inner overflow-hidden">
        <div 
          className="bg-indigo-500 h-4 rounded-full transition-all duration-700 ease-out shadow-[0_2px_10px_rgba(99,102,241,0.5)] relative" 
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute top-0 right-0 bottom-0 w-full bg-white/20 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};