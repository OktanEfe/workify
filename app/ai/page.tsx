import React from 'react';
import AiHero from '@/components/ai/AiHero';
import AiFeatures from '@/components/ai/AiFeatures';
import AiWorkflow from '@/components/ai/AiWorkflow';
import FinalCTA from '@/components/home/FinalCTA'; 

export default function AiPage() {
  return (
    <main>
      <AiHero />
      <AiFeatures />
      <AiWorkflow />
      <section className="bg-white py-20">
        <div className="max-w-3xl mx-auto text-center px-6">
            <h2 className="text-4xl font-bold mb-6 text-[#1d1d1f]">AI ile Fark Yaratın.</h2>
            <p className="text-lg text-[#86868b] mb-10">
                Workify&apos;ın yapay zeka gücüyle daha az çabayla daha fazlasını başarın.
            </p>
            <button className="bg-[#007AFF] text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-[#0071e3] transition-colors shadow-lg">
                AI Özelliklerini Deneyin
            </button>
        </div>
      </section>
      <FinalCTA />
    </main>
  );
}