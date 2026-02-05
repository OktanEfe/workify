"use client";

import Link from 'next/link';
import Image from "next/image";
import { useState } from 'react';

const Navbar = () => {
  const [lang, setLang] = useState('TR'); 

  const navLinks = [
    { name: 'Ürün', href: '/product' },
    { name: 'Yapay Zeka', href: '/ai' },
    { name: 'Çözümler', href: '/solutions' },
    { name: 'Fiyatlandırma', href: '/pricing' },
    { name: 'İletişim', href: '/contact' },
    { name: 'Çalışma Alanı', href: '/workspace' },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-gray-100/50">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-[19px] font-semibold tracking-tight hover:opacity-80 transition-opacity"
        >
          <Image
            src="/logo.jpeg"
            alt="Workify Logo"
            width={32}
            height={32}
            className="object-contain rounded-lg"
          />
          <span>
            Workify<span className="text-[#007AFF]">.</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-[12px] text-[#1d1d1f]/80 hover:text-[#007AFF] transition-colors font-medium"
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group mr-2">
            <button className="text-[12px] font-medium text-[#1d1d1f]/70 hover:text-[#1d1d1f] flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-100 transition-all">
              <span>{lang === 'TR' ? '🇹🇷 TR' : lang === 'EN' ? '🇺🇸 EN' : '🇩🇪 DE'}</span>
              <span className="text-[10px] opacity-50">▼</span>
            </button>
            
            <div className="absolute right-0 top-full mt-1 w-28 bg-white/90 backdrop-blur-xl border border-gray-100 rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60]">
              <button onClick={() => setLang('TR')} className="w-full text-left px-4 py-2 text-[12px] hover:bg-gray-50 flex items-center gap-2">🇹🇷 Türkçe</button>
              <button onClick={() => setLang('EN')} className="w-full text-left px-4 py-2 text-[12px] hover:bg-gray-50 flex items-center gap-2">🇺🇸 English</button>
              <button onClick={() => setLang('DE')} className="w-full text-left px-4 py-2 text-[12px] hover:bg-gray-50 flex items-center gap-2">🇩🇪 Deutsch</button>
            </div>
          </div>

          <Link href="/auth">
            <button className="text-[#1d1d1f] px-3 py-1 text-[12px] font-medium hover:text-[#007AFF] transition-all">
              Giriş Yap
            </button>
          </Link>

          <Link href="/auth">
            <button className="bg-[#007AFF] text-white px-4 py-1.5 rounded-full text-[12px] font-medium hover:bg-[#0071e3] transition-all transform active:scale-95 shadow-sm">
              Kayıt Ol
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;