const FinalCTA = () => {
    return (
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto bg-[#007AFF] rounded-[48px] p-12 md:p-20 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
          
          <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight">Potansiyelini bugün serbest bırak.</h2>
          <p className="text-blue-100 text-xl mb-10 max-w-xl mx-auto">
            Workify ile tanışan binlerce geliştirici ve öğrenci arasına katılın.
          </p>
          <button className="bg-white text-[#007AFF] px-10 py-4 rounded-full text-lg font-bold hover:bg-blue-50 transition-colors shadow-xl">
            Şimdi Ücretsiz Başla
          </button>
        </div>
      </section>
    );
  };
  
  export default FinalCTA;