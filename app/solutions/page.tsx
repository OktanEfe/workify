import React from 'react';
import SolutionGrid from '@/components/solutions/SolutionGrid';

export default function SolutionsPage() {
  return (
    <main className="pt-32 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mb-16">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[#1d1d1f] mb-8">
            Herkes için <br /> bir çözüm var.
          </h1>
          <p className="text-xl text-[#86868b] leading-relaxed">
            Workify, bireysel kullanıcılardan büyük ekiplere kadar herkesin çalışma şeklini dönüştürmek için tasarlandı.
          </p>
        </div>

        <SolutionGrid />

        <div className="mt-20 bg-[#1d1d1f] rounded-[48px] p-12 md:p-20 text-white flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="max-w-md text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Kurumsal ölçekte güç.</h2>
            <p className="text-gray-400 text-lg">
              Şirketinize özel güvenlik, sınırsız kullanıcı ve 7/24 öncelikli destek.
            </p>
          </div>
          <button className="bg-white text-black px-10 py-4 rounded-full font-bold hover:bg-gray-200 transition-colors shrink-0">
            Satışla İletişime Geç
          </button>
        </div>
      </div>
    </main>
  );
}