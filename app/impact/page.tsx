"use client";
export default function Impact(){
  return (
    <div className="min-h-screen bg-[#F8F9FB] text-zinc-900">
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b">
        <div className="max-w-[1000px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-xl bg-zinc-900 text-white grid place-items-center font-black">C</div><div className="font-black text-sm">CivicLens Kenya</div><span className="text-[10px] px-2 py-1 rounded-full bg-zinc-100">47 Counties</span></div>
          <div className="flex gap-2"><a href="/" className="text-xs px-3 py-1.5 rounded-full border bg-white">Dashboard</a><a href="/reports" className="text-xs px-3 py-1.5 rounded-full bg-zinc-900 text-white">Reports</a></div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto p-3 md:p-4 space-y-4">
        <div className="rounded-[24px] bg-zinc-900 text-white p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#FF4D00]/20 blur-[80px] rounded-full" />
          <div className="relative">
            <div className="text-[11px] tracking-widest opacity-60">KENYA • 47 COUNTIES • PUBLIC CONVERSATION INTELLIGENCE</div>
            <h1 className="text-[32px] md:text-[48px] font-black leading-[0.9] mt-3">Every county matters. <span className="text-[#FF4D00]">We track all 47.</span></h1>
            <p className="text-[14px] opacity-80 mt-3 max-w-[650px]">From Turkana to Kwale, Kisumu to Garissa, Mandera to Vihiga. 50 leaders, 5 platforms, Swahili/Sheng/English. Pilot validated in Bomet, now scaling national.</p>
            <div className="mt-5 flex flex-wrap gap-2 text-[11px]">
              <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10"><b>47</b> Counties - equal weight</span>
              <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10"><b>50</b> Leaders - Gov + Ruto + DP + Raila</span>
              <span className="px-3 py-1.5 rounded-full bg-[#25D366] text-black font-bold">71% WhatsApp pattern - nationwide</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-[16px] border p-4"><div className="text-[10px] text-zinc-500">PROBLEM - KENYA</div><div className="font-black text-sm mt-1">12M Kenyans talk in WA, no national data</div><div className="text-[11px] text-zinc-500 mt-1">All counties complain about roads, maji, ufisadi - but no one tracks nationally.</div></div>
          <div className="bg-white rounded-[16px] border p-4"><div className="text-[10px] text-zinc-500">SOLUTION</div><div className="font-black text-sm mt-1">CivicLens - 47 counties same engine</div><div className="text-[11px] text-zinc-500 mt-1">Same AI for Turkana and Kiambu. Swahili NLP. Anonymized. Daily national dashboard.</div></div>
          <div className="bg-[#FF4D00] rounded-[16px] border p-4 text-white"><div className="text-[10px] opacity-80">VALIDATED</div><div className="font-black text-sm mt-1">Bomet pilot - proof, not focus</div><div className="text-[11px] opacity-90 mt-1">6 reporters Siongiroi proved model works. Now replicate to 46 other counties.</div></div>
        </div>

        <div className="bg-white rounded-[20px] border p-5">
          <b className="text-sm">National Coverage Map - 47 Counties</b>
          <div className="mt-3 grid grid-cols-8 md:grid-cols-12 gap-1">
            {Array.from({length:47}).map((_,i)=><div key={i} className="h-8 rounded-lg bg-zinc-100 border grid place-items-center text-[9px] font-bold">{i+1}</div>)}
          </div>
          <div className="mt-3 flex flex-wrap gap-1 text-[10px]"><span className="px-2 py-1 rounded-full bg-zinc-900 text-white">Turkana</span><span className="px-2 py-1 rounded-full bg-white border">Mombasa</span><span className="px-2 py-1 rounded-full bg-white border">Kisumu</span><span className="px-2 py-1 rounded-full bg-white border">Kwale</span><span className="px-2 py-1 rounded-full bg-white border">Garissa</span><span className="px-2 py-1 rounded-full bg-white border">Uasin Gishu</span><span className="px-2 py-1 rounded-full bg-orange-100 border border-orange-200">Bomet - pilot validated</span><span className="px-2 py-1 rounded-full bg-white border">Nairobi</span></div>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div className="bg-white rounded-[20px] border p-5"><div className="text-[11px] text-zinc-500">STARTER</div><div className="text-2xl font-black mt-1">$250<span className="text-sm font-normal"> / county / mo</span></div><div className="text-[11px] mt-3">Pick ANY county - Turkana, Kwale, Kisumu, etc. Same quality as Bomet pilot.</div><a href="https://wa.me/254700000000?text=Sponsor%20County" className="mt-4 block text-center h-10 grid place-items-center rounded-full bg-zinc-900 text-white text-xs font-bold">Sponsor Any County</a></div>
          <div className="bg-zinc-900 rounded-[20px] border p-5 text-white ring-2 ring-[#FF4D00]"><div className="text-[11px] opacity-60">GROWTH - 5 COUNTIES</div><div className="text-2xl font-black mt-1">$1,000<span className="text-sm opacity-60"> / mo</span></div><div className="text-[11px] mt-3 opacity-80">Choose 5 counties across Kenya - e.g. Turkana + Kwale + Kisumu + Garissa + Kiambu. National comparison.</div><a href="https://wa.me/254700000000?text=5%20Counties" className="mt-4 block text-center h-10 grid place-items-center rounded-full bg-[#FF4D00] text-white text-xs font-bold">Sponsor 5</a></div>
          <div className="bg-white rounded-[20px] border p-5"><div className="text-[11px] text-zinc-500">NATIONAL</div><div className="text-2xl font-black mt-1">$3,500<span className="text-sm font-normal"> / mo</span></div><div className="text-[11px] mt-3">All 47 counties. For NGOs, media, researchers who need Kenya-wide view.</div><a href="https://wa.me/254700000000?text=National%2047" className="mt-4 block text-center h-10 grid place-items-center rounded-full border border-zinc-900 text-xs font-bold">Book Call</a></div>
        </div>
      </div>
    </div>
  )
}


