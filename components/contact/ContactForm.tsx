"use client";
import React from 'react';

const ContactForm = () => {
  return (
    <div className="bg-white p-8 md:p-12 rounded-[40px] border border-gray-100 shadow-sm">
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#1d1d1f] ml-1">Adınız</label>
            <input 
              type="text" 
              placeholder="Steve Jobs"
              className="w-full px-5 py-4 rounded-2xl bg-[#f5f5f7] border-none focus:ring-2 focus:ring-[#007AFF] outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#1d1d1f] ml-1">E-posta</label>
            <input 
              type="email" 
              placeholder="steve@apple.com"
              className="w-full px-5 py-4 rounded-2xl bg-[#f5f5f7] border-none focus:ring-2 focus:ring-[#007AFF] outline-none transition-all"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#1d1d1f] ml-1">Konu</label>
          <select className="w-full px-5 py-4 rounded-2xl bg-[#f5f5f7] border-none focus:ring-2 focus:ring-[#007AFF] outline-none transition-all appearance-none">
            <option>Genel Destek</option>
            <option>Satış ve Kurumsal</option>
            <option>Hata Bildirimi</option>
            <option>Geri Bildirim</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#1d1d1f] ml-1">Mesajınız</label>
          <textarea 
            rows={5}
            placeholder="Size nasıl yardımcı olabiliriz?"
            className="w-full px-5 py-4 rounded-2xl bg-[#f5f5f7] border-none focus:ring-2 focus:ring-[#007AFF] outline-none transition-all resize-none"
          ></textarea>
        </div>

        <button className="w-full md:w-auto px-10 py-4 bg-[#007AFF] text-white rounded-full font-bold hover:bg-[#0071e3] transition-all transform active:scale-95">
          Mesajı Gönder
        </button>
      </form>
    </div>
  );
};

export default ContactForm;