import React from 'react';
import PricingTabs from '@/components/pricing/PricingTabs';

export default function PricingPage() {
  return (
    <main className="pt-32 pb-20 bg-[#fafafa]">
      <div className="max-w-4xl mx-auto text-center px-6 mb-12">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-[#1d1d1f] mb-6">
          Sizin için doğru plan.
        </h1>
        <p className="text-xl text-[#86868b]">
          Şeffaf fiyatlandırma, gizli ücret yok. İstediğiniz zaman iptal edin.
        </p>
      </div>

      <PricingTabs />

      <div className="max-w-2xl mx-auto px-6 mt-20 text-center">
        <h4 className="font-bold mb-4">Bir sorunuz mu var?</h4>
        <p className="text-[#86868b] text-sm">
          Öğrenci indirimleri, kurumsal lisanslar veya özel paketler hakkında bilgi almak için bizimle iletişime geçebilirsiniz.
        </p>
      </div>
    </main>
  );
}