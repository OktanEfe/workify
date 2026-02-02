"use client";
import { useState } from 'react';

const PricingTabs = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: "Starter",
      price: isAnnual ? "0" : "0",
      desc: "Temel düzenleme araçları ve öğrenciler için ideal.",
      features: ["5 Proje Limiti", "AI Özetleme (Günde 5)", "Topluluk Desteği", "Temel Dosya Yönetimi"],
      button: "Ücretsiz Başlat",
      highlight: false
    },
    {
      name: "Pro",
      price: isAnnual ? "190" : "240",
      desc: "Profesyoneller ve güç kullanıcıları için her şey.",
      features: ["Sınırsız Proje", "Sınırsız AI Asistanı", "Öncelikli Destek", "Gelişmiş Terminal Erişimi", "Özel Eklentiler"],
      button: "Hemen Başla",
      highlight: true
    },
    {
      name: "Team",
      price: isAnnual ? "450" : "550",
      desc: "Küçük ekipler için ortak çalışma alanı.",
      features: ["Ekip Paylaşımı", "Yönetici Paneli", "Gelişmiş Güvenlik", "7/24 Teknik Destek"],
      button: "Ekibi Kaydet",
      highlight: false
    }
  ];

  return (
    <section className="py-12">
      {/* Toggle */}
      <div className="flex justify-center mb-16">
        <div className="bg-[#f5f5f7] p-1 rounded-full flex items-center relative">
          <button 
            onClick={() => setIsAnnual(false)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${!isAnnual ? 'bg-white shadow-sm text-[#007AFF]' : 'text-[#86868b]'}`}
          >
            Aylık
          </button>
          <button 
            onClick={() => setIsAnnual(true)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${isAnnual ? 'bg-white shadow-sm text-[#007AFF]' : 'text-[#86868b]'}`}
          >
            Yıllık <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full ml-1">%20 Kar et</span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
        {plans.map((plan) => (
          <div 
            key={plan.name}
            className={`rounded-[32px] p-10 flex flex-col transition-all duration-300 ${
              plan.highlight 
              ? 'bg-[#1d1d1f] text-white scale-105 shadow-2xl ring-4 ring-blue-500/20' 
              : 'bg-white text-[#1d1d1f] border border-gray-100 shadow-sm'
            }`}
          >
            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
            <p className={`text-sm mb-8 ${plan.highlight ? 'text-gray-400' : 'text-[#86868b]'}`}>{plan.desc}</p>
            
            <div className="mb-8">
              <span className="text-5xl font-bold">₺{plan.price}</span>
              <span className={`text-sm ${plan.highlight ? 'text-gray-400' : 'text-[#86868b]'}`}> /ay</span>
            </div>

            <ul className="space-y-4 mb-12 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm italic">
                  <span className={plan.highlight ? 'text-blue-400' : 'text-blue-600'}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button className={`w-full py-4 rounded-full font-bold transition-all ${
              plan.highlight 
              ? 'bg-[#007AFF] text-white hover:bg-[#0071e3]' 
              : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-gray-200'
            }`}>
              {plan.button}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PricingTabs;