"use client";
import React from 'react';

interface RoleSelectionProps {
  onSelect: (role: 'student' | 'professional') => void;
}

const RoleSelection = ({ onSelect }: RoleSelectionProps) => {
  return (
    <div className="max-w-4xl mx-auto px-6">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1d1d1f] mb-4">
          Çalışma alanınızı hazırlayalım.
        </h1>
        <p className="text-xl text-[#86868b]">
          Size en uygun araçları sunabilmemiz için kullanım amacınızı seçin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <button 
          onClick={() => onSelect('student')}
          className="group relative bg-white border border-gray-100 p-10 rounded-[40px] text-left hover:border-[#007AFF] hover:shadow-2xl transition-all duration-500 overflow-hidden"
        >
          <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-500">🎓</div>
          <h3 className="text-2xl font-bold text-[#1d1d1f] mb-3">Öğrenciyim</h3>
          <p className="text-[#86868b] leading-relaxed">
            Ders notları, PDF analizleri ve sınav hazırlık araçlarıyla akademik hayatınızı organize edin.
          </p>
          <div className="mt-8 flex items-center text-[#007AFF] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
            Devam et →
          </div>
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-purple-50 rounded-full blur-3xl group-hover:bg-purple-100 transition-colors" />
        </button>

        {/* Çalışan Kartı */}
        <button 
          onClick={() => onSelect('professional')}
          className="group relative bg-white border border-gray-100 p-10 rounded-[40px] text-left hover:border-[#007AFF] hover:shadow-2xl transition-all duration-500 overflow-hidden"
        >
          <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-500">💼</div>
          <h3 className="text-2xl font-bold text-[#1d1d1f] mb-3">Çalışanım</h3>
          <p className="text-[#86868b] leading-relaxed">
            Proje yönetimi, ekip işbirliği ve AI destekli kod/içerik üretim araçlarıyla profesyonel verimliliğinizi artırın.
          </p>
          <div className="mt-8 flex items-center text-[#007AFF] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
            Devam et →
          </div>
          {/* Arka plan süsü */}
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-blue-50 rounded-full blur-3xl group-hover:bg-blue-100 transition-colors" />
        </button>
      </div>
    </div>
  );
};

export default RoleSelection;