import React from 'react';

const AiFeatures = () => {
  const features = [
    {
      title: "Akıllı Özetleme",
      description: "Uzun dokümanları, toplantı notlarını veya ders materyallerini saniyeler içinde özetleyin. Anahtar noktaları kaçırmayın.",
      icon: "✨",
      color: "from-blue-500 to-blue-700"
    },
    {
      title: "Otomatik Kod Tamamlama",
      description: "Yapay zeka, kod yazarken size bağlama uygun öneriler sunar. Daha hızlı ve hatasız kod yazın.",
      icon: "✍️",
      color: "from-purple-500 to-purple-700"
    },
    {
      title: "Proje Analizi",
      description: "Projenizin zayıf noktalarını, potansiyel hataları ve performans iyileştirmelerini tespit eder.",
      icon: "📈",
      color: "from-green-500 to-green-700"
    },
    {
      title: "Yaratıcı Fikir Üretimi",
      description: "Yeni proje fikirleri, makale başlıkları veya ders konuları için yapay zekadan ilham alın.",
      icon: "💡",
      color: "from-pink-500 to-pink-700"
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-16 text-[#1d1d1f]">Workify AI Ne Yapabilir?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-[#f5f5f7] rounded-[32px] p-8 text-center border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className={`w-16 h-16 mx-auto rounded-full mb-6 flex items-center justify-center text-3xl shadow-lg bg-gradient-to-br ${feature.color}`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#1d1d1f]">{feature.title}</h3>
              <p className="text-[#86868b] text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AiFeatures;