import React from 'react';

const AiWorkflow = () => {
  const steps = [
    { id: 1, text: "Görevi tanımlayın", icon: "💬" },
    { id: 2, text: "AI analiz eder", icon: "⚙️" },
    { id: 3, text: "Çözüm üretir", icon: "💡" },
    { id: 4, text: "Siz onaylarsınız", icon: "✅" },
  ];

  return (
    <section className="py-24 bg-[#F5F5F7]">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-16 text-[#1d1d1f]">Workify AI Nasıl Çalışır?</h2>
        <div className="flex flex-col md:flex-row justify-center items-center relative">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="relative flex flex-col items-center text-center w-full md:w-1/4">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl shadow-lg border-2 border-[#007AFF] mb-4">
                  {step.icon}
                </div>
                <h4 className="text-lg font-semibold text-[#1d1d1f]">{step.text}</h4>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute h-0.5 bg-gray-300 w-[calc(25%-100px)] z-0" 
                     style={{ left: `${index * 25 + 12.5}%`, transform: 'translateX(25%)' }}/>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AiWorkflow;