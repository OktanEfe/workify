import React from 'react';

const ContactInfo = () => {
  const channels = [
    { title: "Destek", detail: "destek@workify.com", icon: "✉️" },
    { title: "Satış", detail: "sales@workify.com", icon: "💼" },
    { title: "Basın", detail: "press@workify.com", icon: "📢" },
    { title: "Ofis", detail: "Levent, İstanbul", icon: "📍" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {channels.map((item) => (
        <div key={item.title} className="p-8 rounded-[32px] bg-[#f5f5f7] border border-transparent hover:border-gray-200 transition-all group">
          <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 inline-block">
            {item.icon}
          </div>
          <h4 className="text-sm font-bold text-[#86868b] uppercase tracking-widest mb-1">{item.title}</h4>
          <p className="text-lg font-semibold text-[#1d1d1f]">{item.detail}</p>
        </div>
      ))}
    </div>
  );
};

export default ContactInfo;