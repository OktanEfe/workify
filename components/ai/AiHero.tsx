import React from 'react';

const AiHero = () => {
  return (
    <section className="relative pt-32 pb-24 bg-gradient-to-br from-gray-900 to-black text-white overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute w-[800px] h-[800px] bg-blue-600 rounded-full mix-blend-lighten blur-3xl opacity-30 animate-pulse -left-40 -top-40" />
        <div className="absolute w-[600px] h-[600px] bg-purple-600 rounded-full mix-blend-lighten blur-3xl opacity-20 animate-pulse delay-500 -right-40 -bottom-40" />
      </div>

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <span className="text-blue-400 font-semibold text-sm tracking-widest uppercase mb-4 block">Workify AI</span>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
          Yaratıcılığınızı serbest bırakın, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-400">yapay zeka çalışsın.</span>
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Workify AI, her adımda size destek olur; fikirlerinizi geliştirir, görevlerinizi otomatikleştirir ve potansiyelinizi maksimize eder.
        </p>
      </div>
    </section>
  );
};

export default AiHero;