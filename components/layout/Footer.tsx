import React from 'react';
import Link from 'next/link';

const Footer = () => {
  const footerLinks = {
    Ürün: ['Özellikler', 'Yapay Zeka', 'Güvenlik', 'Fiyatlandırma'],
    Çözümler: ['Developerlar', 'Öğrenciler', 'Ekipler', 'Kurumsal'],
    Destek: ['Yardım Merkezi', 'Topluluk', 'İletişim', 'Durum'],
    Şirket: ['Hakkımızda', 'Blog', 'Kariyer', 'Etik İlkeler'],
  };

  return (
    <footer className="bg-[#f5f5f7] text-[#1d1d1f] pt-16 pb-8 border-t border-gray-200">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-[12px] font-semibold mb-4 text-[#1d1d1f]">{title}</h4>
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-[12px] text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-[#d2d2d7] pt-6">
          <p className="text-[12px] text-[#86868b] mb-4 text-center md:text-left">
            Diğer yollar: Bir <span className="text-[#007AFF] underline cursor-pointer">Workify Store</span> bulun veya bir yetkili satıcıdan bilgi alın.
          </p>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[12px] text-[#6e6e73]">
              Copyright © 2026 Workify Inc. Tüm hakları saklıdır.
            </p>
            <div className="flex gap-4 text-[12px] text-[#6e6e73]">
              <span className="hover:underline cursor-pointer">Gizlilik Politikası</span>
              <span className="hover:underline cursor-pointer">Çerezlerin Kullanımı</span>
              <span className="hover:underline cursor-pointer">Kullanım Şartları</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;