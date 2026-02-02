import React from 'react';

const ProductFeatureShowcase = () => {
  return (
    <section className="py-10 space-y-20">
      <div className="bg-[#f5f5f7] rounded-[48px] p-8 md:p-16 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-white text-[#007AFF] text-xs font-bold tracking-widest uppercase border border-blue-100">
            Yeni Nesil
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1d1d1f]">
            Dosyalarınız artık sizi tanıyor.
          </h2>
          <p className="text-lg text-[#86868b] leading-relaxed">
            Workify, üzerinde çalıştığınız projenin bağlamını anlar. Bir kod dosyası açtığınızda ilgili dokümantasyonu, bir ders notu açtığınızda ise geçmiş sınav sorularını yan tarafa otomatik getirir.
          </p>
        </div>
        <div className="flex-1 w-full aspect-square bg-white rounded-[32px] shadow-inner flex items-center justify-center border border-gray-100">
          <span className="text-6xl animate-pulse">🧠</span>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-[48px] p-8 md:p-16 flex flex-col md:flex-row-reverse items-center gap-12 shadow-sm">
        <div className="flex-1 space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1d1d1f]">
            Işık hızında komut verin.
          </h2>
          <p className="text-lg text-[#86868b] leading-relaxed">
            <kbd className="bg-gray-100 px-2 py-1 rounded border shadow-sm">⌘ + K</kbd> ile her şey elinizin altında. Dosya oluşturun, AI&apos;ya soru sorun veya terminale geçiş yapın. Elinizi klavyeden ayırmadan her şeyi yönetin.
          </p>
        </div>
        <div className="flex-1 w-full aspect-square bg-[#1d1d1f] rounded-[32px] flex items-center justify-center overflow-hidden">
           <div className="w-4/5 h-1/2 bg-gray-800 rounded-lg border border-gray-700 p-4 font-mono text-sm text-green-400">
              $ workify create new-project --template=react
           </div>
        </div>
      </div>
    </section>
  );
};

export default ProductFeatureShowcase;