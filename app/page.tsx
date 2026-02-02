import Hero from '@/components/home/Hero';
import BentoGrid from '@/components/home/BentoGrid';
import PersonaSection from '@/components/home/PersonaSection';
import AppPreview from '@/components/home/AppPreview';
import FinalCTA from '@/components/home/FinalCTA';
export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero />
      
      <div className="w-full py-10 flex justify-center items-center gap-12 grayscale opacity-40 select-none">
         <span className="font-bold text-xl tracking-tighter italic">UNIVERSITY</span>
         <span className="font-bold text-xl tracking-tighter">DEV-COMM</span>
         <span className="font-bold text-xl tracking-tighter italic">TECH-CORP</span>
      </div>

      <BentoGrid />
      <AppPreview />
      <PersonaSection />
      <FinalCTA />

    </main>
  );
}