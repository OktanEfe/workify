"use client";
import { useState } from 'react';

const AuthCard = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div className="w-full max-w-[440px] perspective-1000">
      {/* Form Kartı */}
      <div className="relative bg-white/80 backdrop-blur-2xl p-8 md:p-10 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/20 transition-all duration-500">
        
        {/* Toggle (Switch) */}
        <div className="flex bg-[#f5f5f7] p-1 rounded-2xl mb-10 relative">
          <div 
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out ${mode === 'register' ? 'left-[calc(50%+2px)]' : 'left-1'}`}
          />
          <button 
            onClick={() => setMode('login')}
            className={`relative z-10 flex-1 py-2 text-sm font-semibold transition-colors ${mode === 'login' ? 'text-[#007AFF]' : 'text-[#86868b]'}`}
          >
            Giriş Yap
          </button>
          <button 
            onClick={() => setMode('register')}
            className={`relative z-10 flex-1 py-2 text-sm font-semibold transition-colors ${mode === 'register' ? 'text-[#007AFF]' : 'text-[#86868b]'}`}
          >
            Kayıt Ol
          </button>
        </div>

        {/* Form İçeriği */}
        <div className="space-y-5">
          <h2 className="text-3xl font-bold tracking-tight text-[#1d1d1f] mb-2">
            {mode === 'login' ? 'Tekrar hoş geldin.' : 'Aramıza katıl.'}
          </h2>
          <p className="text-[#86868b] text-sm mb-8 leading-relaxed">
            {mode === 'login' 
              ? 'Çalışma alanına erişmek için bilgilerini gir.' 
              : 'Workify ile üretkenliğini bir üst seviyeye taşı.'}
          </p>

          <div className="space-y-4">
            {mode === 'register' && (
              <input 
                type="text" 
                placeholder="Ad Soyad"
                className="w-full px-5 py-4 rounded-2xl bg-[#f5f5f7] border-none focus:ring-2 focus:ring-[#007AFF] outline-none transition-all"
              />
            )}
            <input 
              type="email" 
              placeholder="E-posta adresi"
              className="w-full px-5 py-4 rounded-2xl bg-[#f5f5f7] border-none focus:ring-2 focus:ring-[#007AFF] outline-none transition-all"
            />
            <input 
              type="password" 
              placeholder="Şifre"
              className="w-full px-5 py-4 rounded-2xl bg-[#f5f5f7] border-none focus:ring-2 focus:ring-[#007AFF] outline-none transition-all"
            />
          </div>

          <button className="w-full py-4 bg-[#007AFF] text-white rounded-2xl font-bold hover:bg-[#0071e3] transition-all transform active:scale-[0.98] mt-4 shadow-lg shadow-blue-500/20">
            {mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
          </button>

          <div className="relative py-4 flex items-center">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase tracking-widest">veya</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          <button className="w-full py-4 bg-white border border-gray-200 text-[#1d1d1f] rounded-2xl font-semibold flex items-center justify-center gap-3 hover:bg-gray-50 transition-all">
            <span className="text-xl"></span> Apple ile Devam Et
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthCard;