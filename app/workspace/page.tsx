"use client";
import { useState } from 'react';
import RoleSelection from '@/components/workspace/RoleSelection';
import Sidebar from '@/components/workspace/Sidebar';
import Overview from '@/components/workspace/views/Overview'; 

export default function WorkspacePage() {
  const [role, setRole] = useState<'student' | 'professional' | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const studentTabs = [
    { id: 'overview', name: 'Genel Bakış', icon: '🏠' },
    { id: 'notes', name: 'Notlarım', icon: '📝' },
    { id: 'pdf-ai', name: 'PDF Asistanı', icon: '📄' },
    { id: 'schedule', name: 'Ders Programı', icon: '📅' },
  ];

  const proTabs = [
    { id: 'overview', name: 'Dashboard', icon: '📊' },
    { id: 'projects', name: 'Projeler', icon: '📁' },
    { id: 'team', name: 'Ekip Alanı', icon: '👥' },
    { id: 'ai-code', name: 'AI Kod Yazıcı', icon: '💻' },
  ];

  if (!role) {
    return (
      <main className="min-h-screen pt-32 pb-20 bg-[#fafafa]">
        <RoleSelection onSelect={(selectedRole) => setRole(selectedRole)} />
      </main>
    );
  }

  // Rol seçilmişse Paneli göster
  return (
    <main className="min-h-screen flex bg-white pt-14"> {/* Navbar yüksekliği kadar padding-top */}
      {/* Sol Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        tabs={role === 'student' ? studentTabs : proTabs}
        role={role}
      />

      <section className="flex-1 bg-white overflow-y-auto h-[calc(100vh-3.5rem)]">
        {activeTab === 'overview' && <Overview />}
        {activeTab === 'notes' && <div className="p-8 italic italic">Notlar sayfası tasarımı yakında...</div>}
      </section>
    </main>
  );
}