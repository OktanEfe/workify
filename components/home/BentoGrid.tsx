const BentoGrid = () => {
    return (
      <section className="w-full py-24 bg-[#F5F5F7]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[600px]">
            
            <div className="md:col-span-8 bg-white rounded-[32px] p-10 border border-gray-100 flex flex-col justify-between overflow-hidden group hover:shadow-2xl transition-all duration-500">
              <div>
                <span className="text-[14px] font-bold text-[#007AFF] uppercase tracking-widest">Yapay Zeka</span>
                <h3 className="text-3xl font-bold mt-2">Düşünceleriniz, otomatik olarak aksiyona dönüşür.</h3>
              </div>
              <div className="mt-8 relative h-48 bg-blue-50 rounded-2xl border border-blue-100/50 flex items-center justify-center">
                 <p className="text-blue-400 font-mono text-sm">AI Engine Active: Optimizing Workflow...</p>
              </div>
            </div>
  
            <div className="md:col-span-4 bg-white rounded-[32px] p-8 border border-gray-100 flex flex-col justify-between hover:shadow-2xl transition-all">
               <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-500 font-bold">🎯</div>
               <div>
                  <h4 className="text-xl font-bold mb-2">Odak Modu</h4>
                  <p className="text-sm text-[#86868b]">Dikkat dağıtıcı unsurları temizleyin.</p>
               </div>
            </div>
  
            <div className="md:col-span-4 bg-[#1d1d1f] text-white rounded-[32px] p-8 flex flex-col justify-between hover:scale-[1.02] transition-transform">
               <h4 className="text-xl font-bold">100+ Entegrasyon</h4>
               <p className="text-sm opacity-60">GitHub, Notion ve daha fazlası.</p>
            </div>
  
            <div className="md:col-span-8 bg-white rounded-[32px] p-10 border border-gray-100 flex items-center gap-8 hover:shadow-2xl transition-all">
               <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-4">Developerlar için Terminal Hızı</h3>
                  <p className="text-[#86868b]">Klavye odaklı kısayollarla kod yazma hızında yönetim.</p>
               </div>
               <div className="hidden md:block w-32 h-32 bg-gray-100 rounded-full animate-pulse" />
            </div>
  
          </div>
        </div>
      </section>
    );
  };
  
  export default BentoGrid;