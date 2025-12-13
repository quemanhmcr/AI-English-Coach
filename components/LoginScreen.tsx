import React, { useState } from 'react';
import { User } from '../types';
import { storageService } from '../services/storage';
import { LogIn, GraduationCap } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = storageService.login(username, password);
    if (user) {
        onLogin(user);
    } else {
        setError('Sai tên đăng nhập hoặc mật khẩu.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
         <div className="bg-indigo-600 p-8 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-heading font-extrabold text-white">EngPractice AI</h1>
            <p className="text-indigo-200 text-sm mt-1">Nền tảng học tiếng Anh thông minh</p>
         </div>
         
         <div className="p-8">
             <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">
                 Đăng nhập hệ thống
             </h2>

             <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tên đăng nhập</label>
                     <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        placeholder="Nhập username..."
                        required
                     />
                 </div>
                 <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mật khẩu</label>
                     <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        placeholder="Nhập mật khẩu..."
                        required
                     />
                 </div>

                 {error && (
                     <div className="p-3 bg-rose-50 text-rose-600 text-sm font-bold rounded-lg text-center">
                         {error}
                     </div>
                 )}

                 <button 
                    type="submit"
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                 >
                    <LogIn className="w-5 h-5"/>
                    Đăng nhập
                 </button>
             </form>
         </div>
      </div>
    </div>
  );
};