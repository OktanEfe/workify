const Overview = () => (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-3xl font-bold mb-6 italic">Genel Bakış</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h4 className="text-sm font-semibold text-gray-400 mb-2 italic">Aktif Görevler</h4>
          <p className="text-4xl font-bold italic">12</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm italic">
          <h4 className="text-sm font-semibold text-gray-400 mb-2 italic">AI Kredisi</h4>
          <p className="text-4xl font-bold italic">85%</p>
        </div>
      </div>
    </div>
  );
  
  export default Overview;