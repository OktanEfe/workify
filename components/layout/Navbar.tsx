"use client"; 

import Link from 'next/link';

const Navbar = () => {
  const navLinks = [
    { name: 'Ürün', href: '/product' },
    { name: 'Yapay Zeka', href: '/ai' },
    { name: 'Çözümler', href: '/solutions' },
    { name: 'Fiyatlandırma', href: '/pricing' },
    { name: 'İletişim', href: '/contact' },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-gray-100/50">
      <div className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-between">
        <Link href="/" className="text-[19px] font-semibold tracking-tight hover:opacity-80 transition-opacity">
          Workify
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-[12px] text-[#1d1d1f]/80 hover:text-[#007AFF] transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>

        <Link href="/auth">
  <button className="bg-[#007AFF] text-white px-4 py-1 rounded-full text-[12px] font-medium hover:bg-[#0071e3] transition-all transform active:scale-95 shadow-sm">
    Giriş Yap
  </button>
</Link>
      </div>
    </nav>
  );
};

export default Navbar;