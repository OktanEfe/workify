"use client";
import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: { id: string; name: string; icon: string }[];
  role: 'student' | 'professional';
}

const Sidebar = ({ activeTab, setActiveTab, tabs, role }: SidebarProps) => {
  return (
    <aside className="w-64 border-r border-gray-100 h-[calc(100vh-3.5rem)] sticky top-14 bg-[#fbfbfb] p-4 flex flex-col">
      <div className="mb-8 px-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {role === 'student' ? 'Öğrenci Paneli' : 'Profesyonel Panel'}
        </span>
      </div>

      <nav className="space-y-1 flex-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id 
              ? 'bg-white shadow-sm text-[#007AFF] ring-1 ring-black/5' 
              : 'text-[#1d1d1f]/70 hover:bg-gray-200/50 hover:text-[#1d1d1f]'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.name}
          </button>
        ))}
      </nav>

      <div className="mt-auto border-t border-gray-100 pt-4 px-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#1d1d1f]">Kullanıcı Adı</span>
            <span className="text-[10px] text-gray-500">Premium Plan</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;