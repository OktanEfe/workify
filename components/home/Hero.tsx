import React from 'react';

const Hero = () => {
  return (
    <section className="relative w-full pt-32 pb-20 px-6 bg-white flex flex-col items-center overflow-hidden">
      <div className="absolute top-0 w-full h-[500px] bg-[radial-gradient(circle_at_center,_rgba(0,122,255,0.05)_0%,_transparent_70%)] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h1 className="text-5xl md:text-[80px] font-bold tracking-tight leading-[1.05] mb-8 text-[#1d1d1f]">
          Zekice çalışın. <br />
          <span className="text-[#007AFF]">Hızlı sonuç alın.</span>
        </h1>
        
        <p className="text-[21px] md:text-[24px] text-[#86868b] max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
          Workify, karmaşık süreçleri Apple sadeliğinde bir arayüz ve yapay zeka gücüyle yönetmenizi sağlar.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
          <button className="bg-[#1d1d1f] text-white px-10 py-4 rounded-full text-[17px] font-semibold hover:bg-[#333] transition-all transform hover:scale-[1.02]">
            Hemen Başla
          </button>
          <button className="text-[#007AFF] text-[17px] font-medium hover:underline flex items-center gap-1 group">
            AI özelliklerini gör <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;