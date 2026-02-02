"use client";
import { useState } from 'react';

const PersonaSection = () => {
  const [activeTab, setActiveTab] = useState<'dev' | 'student'>('dev');

  return (
    <section className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex justify-center mb-12">
          <div className="bg-[#f5f5f7] p-1 rounded-full flex gap-1">
            <button 
              onClick={() => setActiveTab('dev')}
              className={`px-8 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'dev' ? 'bg-white shadow-md text-[#007AFF]' : 'text-[#86868b]'}`}
            >
              Developer
            </button>
            <button 
              onClick={() => setActiveTab('student')}
              className={`px-8 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'student' ? 'bg-white shadow-md text-[#007AFF]' : 'text-[#86868b]'}`}
            >
              Öğrenci
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h3 className="text-4xl font-bold mb-6">
              {activeTab === 'dev' ? "Kod yazmaya odaklanın, gerisini bize bırakın." : "Notlarınız artık daha akıllı."}
            </h3>
            <ul className="space-y-4">
              {(activeTab === 'dev' ? ['Otomatik dokümantasyon', 'Git entegrasyonu', 'Hata analizi'] : ['Ders özeti çıkarma', 'Akıllı takvim', 'Odaklanma modları']).map((item) => (
                <li key={item} className="flex items-center gap-3 text-[#1d1d1f]">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[#007AFF] text-[10px]">✓</div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-[#f5f5f7] aspect-square rounded-[40px] flex items-center justify-center text-4xl">
             {activeTab === 'dev' ? "💻" : "📚"}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PersonaSection;