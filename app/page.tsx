'use client'
export default function ReportsPage(){
  return (
    <div className="min-h-screen bg-[#F2F5FA] w-full overflow-x-hidden">
      {/* MOBILE HEADER - Compact 56px */}
      <header className="h-[56px] bg-[#0A1931] flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#1E5BFF] flex items-center justify-center text-white font-bold text-[13px]">C</div>
          <span className="text-white font-bold text-[16px]">Civic<span className="text-[#3B82F6]">Lens</span></span>
        </div>
        <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-white text-[12px] font-bold">H</div>
      </header>

      {/* TABS - Scrollable on phone, not squeezed */}
      <div className="bg-[#0A1931] border-t border-white/10 flex gap-1 px-2 overflow-x-auto scrollbar-none">
        {[
          {name:'Dashboard', active:false},
          {name:'Mentions', active:false},
          {name:'Leaders', active:false},
          {name:'Reports', active:true},
        ].map(t=>(
          <div key={t.name} className={`whitespace-nowrap px-4 py-3 text-[13px] font-medium border-b-2 ${t.active?'text-white border-[#1E5BFF]':'text-white/50 border-transparent'}`}>{t.name}</div>
        ))}
      </div>

      {/* CONTENT - Phone centered 100% */}
      <main className="px-4 py-4 pb-24 max-w-[480px] mx-auto w-full">
        <p className="text-[10px] font-bold tracking-[0.2em] text-[#1E5BFF] uppercase">Public Conversation Intelligence</p>
        <h1 className="text-[26px] font-extrabold text-[#0A1931] mt-1 leading-none">Reports</h1>

        {/* BLUE CARD - Fixed */}
        <div className="mt-4 rounded-[18px] bg-[#1677FF] p-5 text-white">
          <p className="text-[9px] font-bold tracking-[0.2em] opacity-80 uppercase">Intelligence Reporting</p>
          <h2 className="text-[20px] font-bold mt-2 leading-tight">Conversation Reports</h2>
          <p className="text-[12px] mt-2 opacity-90 leading-[1.4]">Real monitoring data from Google News RSS - Live intelligence for 10 mentions</p>
          <button className="mt-4 bg-white text-black text-[12px] font-bold px-4 py-2 rounded-full">↻ Refresh</button>
        </div>

        {/* STATS - Stack on phone */}
        <div className="mt-3 space-y-3">
          <div className="bg-white rounded-[14px] p-4 flex justify-between items-center shadow-[0_1px_2px_rgba(0,0,0,0.05)] border-l-4 border-l-[#0A1931]">
            <div><p className="text-[9px] font-bold tracking-widest text-gray-400">TOTAL MENTIONS</p><p className="text-[28px] font-extrabold mt-1">10<span className="text-[12px] font-normal text-gray-500 ml-1">Across all platforms</span></p></div>
          </div>
          <div className="bg-white rounded-[14px] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border-l-4 border-l-green-500">
            <p className="text-[9px] font-bold tracking-widest text-gray-400">POSITIVE</p>
            <p className="text-[24px] font-extrabold text-green-600 mt-1">3</p>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full"><div className="h-full w-[30%] bg-green-500 rounded-full"/></div>
          </div>
          <div className="bg-white rounded-[14px] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border-l-4 border-l-gray-300">
            <p className="text-[9px] font-bold tracking-widest text-gray-400">NEUTRAL</p>
            <p className="text-[24px] font-extrabold mt-1">7</p>
          </div>
        </div>
      </main>
    </div>
  )
}