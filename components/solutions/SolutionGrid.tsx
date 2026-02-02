import React from 'react';

const solutions = [
  {
    title: "Yazılım Geliştiriciler",
    subtitle: "Kod yazma sürecinizi hızlandırın.",
    desc: "Entegre terminal, AI kod asistanı ve GitHub senkronizasyonu ile geliştirme ortamınızı tek bir yerden yönetin.",
    icon: "👨‍💻",
    tag: "Pro Plan",
    bg: "bg-blue-50"
  },
  {
    title: "Üniversite Öğrencileri",
    subtitle: "Derslerinizi ve projelerinizi organize edin.",
    desc: "PDF analiz aracı, ders notu özetleme ve akıllı takvim ile akademik başarınızı artırın.",
    icon: "🎓",
    tag: "Ücretsiz",
    bg: "bg-purple-50"
  },
  {
    title: "Yaratıcı Ekipler",
    subtitle: "Birlikte daha hızlı üretin.",
    desc: "Gerçek zamanlı işbirliği, paylaşımlı çalışma alanları ve ekip içi görev dağılımı ile senkronize kalın.",
    icon: "🚀",
    tag: "Kurumsal",
    bg: "bg-orange-50"
  }
];

const SolutionGrid = () => {
  return (
    <section className="py-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {solutions.map((item) => (
          <div key={item.title} className={`${item.bg} rounded-[40px] p-10 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300`}>
            <div>
              <div className="text-4xl mb-6">{item.icon}</div>
              <span className="text-[12px] font-bold uppercase tracking-widest text-gray-500">{item.tag}</span>
              <h3 className="text-2xl font-bold mt-4 mb-4 text-[#1d1d1f]">{item.title}</h3>
              <p className="text-[#6e6e73] leading-relaxed">{item.desc}</p>
            </div>
            <button className="mt-12 text-[#007AFF] font-semibold flex items-center gap-2 group">
              Detayları gör <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SolutionGrid;