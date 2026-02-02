import React from 'react';
import ContactForm from '@/components/contact/ContactForm';
import ContactInfo from '@/components/contact/ContactInfo';

export default function ContactPage() {
  return (
    <main className="pt-32 pb-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[#1d1d1f] mb-6">
            Bize ulaşın.
          </h1>
          <p className="text-xl text-[#86868b] max-w-2xl mx-auto">
            Bir sorunuz mu var? Ekibimiz her zaman yardıma hazır. Size en kısa sürede dönüş yapacağız.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <ContactInfo />
          <ContactForm />
        </div>

        <div className="mt-24 text-center border-t border-gray-100 pt-12">
          <p className="text-[#86868b]">
            Sıkça sorulan sorulara göz atmak ister misiniz? 
            <a href="#" className="text-[#007AFF] ml-2 font-medium hover:underline">Yardım Merkezi&apos;ni ziyaret edin</a>
          </p>
        </div>
      </div>
    </main>
  );
}