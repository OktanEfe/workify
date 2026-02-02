import React from 'react';

const ProductSpecs = () => {
  const specs = [
    { label: "Dosya Sistemi", value: "Hibrit Bulut & Yerel Depolama" },
    { label: "Kod Desteği", value: "Python, JS, TS, Rust, Go, C++, Swift" },
    { label: "Güvenlik", value: "AES-256 Uçtan Uca Şifreleme" },
    { label: "Platformlar", value: "macOS, Windows, iOS, Web" },
  ];

  return (
    <section className="py-24 max-w-3xl mx-auto px-6">
      <h3 className="text-2xl font-bold mb-10 text-center">Teknik Özellikler</h3>
      <div className="divide-y divide-gray-100">
        {specs.map((item) => (
          <div key={item.label} className="py-6 flex justify-between items-center group">
            <span className="text-[#86868b] group-hover:text-[#1d1d1f] transition-colors font-medium">
              {item.label}
            </span>
            <span className="text-[#1d1d1f] font-semibold text-right">{item.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProductSpecs;