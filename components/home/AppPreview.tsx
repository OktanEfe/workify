import React from 'react';

const AppPreview = () => {
  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Tek bir ekran, sınırsız kontrol.</h2>
          <p className="text-[#86868b] text-lg max-w-2xl mx-auto">
            Karmaşık dashboard&apos;ları unudun. Her şey ihtiyacınız olduğunda, tam olmasını beklediğiniz yerde.
          </p>
        </div>

        <div className="relative mx-auto max-w-5xl bg-[#f5f5f7] rounded-t-[20px] p-2 shadow-2xl border border-gray-200">
          <div className="flex gap-1.5 mb-2 px-4 pt-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="bg-white rounded-lg h-[500px] shadow-inner overflow-hidden flex items-center justify-center border border-gray-100">
             <span className="text-gray-300 font-medium italic select-none text-xl tracking-widest">WORKIFY WORKSPACE PREVIEW</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppPreview;