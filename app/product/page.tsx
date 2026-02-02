import React from 'react';
import ProductFeatureShowcase from '@/components/product/ProductFeatureShowcase';
import ProductSpecs from '@/components/product/ProductSpecs';
import FinalCTA from '@/components/home/FinalCTA';

export default function ProductPage() {
  return (
    <main className="min-h-screen pt-24">
      {/* Sayfa Başlığı */}
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          İş akışınızın <br /> yeni mimarisi.
        </h1>
        <p className="text-xl text-[#86868b] max-w-2xl mx-auto">
          Developerlar ve öğrenciler için özel olarak optimize edilmiş, dünyadaki en akıcı çalışma alanı deneyimi.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        <ProductFeatureShowcase />
        <ProductSpecs />
      </div>

      <FinalCTA />
    </main>
  );
}