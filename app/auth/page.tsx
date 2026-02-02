import React from 'react';
import AuthCard from '@/components/auth/AuthCard';

export default function AuthPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#fafafa]">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100 rounded-full blur-[120px] opacity-60" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100 rounded-full blur-[120px] opacity-60" />
      
      <div className="relative z-10 w-full flex flex-col items-center px-6">
        <div className="mb-8 text-2xl font-bold tracking-tighter text-[#1d1d1f]">
          Workify<span className="text-[#007AFF]">.</span>
        </div>

        <AuthCard />

        <p className="mt-12 text-[#86868b] text-xs max-w-[300px] text-center leading-relaxed">
          Devam ederek Workify&apos;ın <span className="underline cursor-pointer text-[#1d1d1f]">Kullanım Koşulları</span> ve <span className="underline cursor-pointer text-[#1d1d1f]">Gizlilik Politikası</span>&apos;nı kabul etmiş olursunuz.
        </p>
      </div>
    </main>
  );
}