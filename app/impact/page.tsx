"use client";

export default function Impact(){
  return (
    <div className="min-h-screen bg-[#F8F9FB] text-zinc-900">
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b">
        <div className="max-w-[1000px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white grid place-items-center font-black">C</div>
            <div className="font-black text-sm">CivicLens</div>
            <span className="text-[10px] px-2 py-1 rounded-full bg-zinc-100 ml-2">Impact Deck</span>
          </div>
          <div className="flex gap-2">
            <a href="/" className="text-xs px-3 py-1.5 rounded-full border bg-white">Dashboard</a>
            <a href="/reports" className="text-xs px-3 py-1.5 rounded-full bg-zinc-900 text-white">Live Reports</a>
          </div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto p-3 md:p-4 space-y-4">
        <div className="rounded-[24px] bg-zinc-900 text-white p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#FF4D00]/20 blur-[80px] rounded-full" />
          <div className="relative">
            <div className="text-[11px] tracking-widest opacity-60">SPONSOR IMPACT - SIONGIROI PILOT</div>
            <h1 className="text-[32px] md:text-[48px] font-black leading-[0.9] tracking-tight mt-3">From WhatsApp noise to <span className="text-[#FF4D00]">county action.</span></h1>
            <p className="text-[14px] opacity-80 mt-3 max-w-[600px]">We track public conversation about 50 leaders across 47 counties in Swahili, Sheng, Kalenjin. Bomet pilot live with 6 citizen reporters in Siongiroi.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <div className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[11px]"><b>50</b> Leaders tracked</div>
              <div className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[11px]"><b>1,247</b> mentions LIVE</div>
              <div className="px-3 py-1.5 rounded-full bg-[#25D366] text-black font-bold text-[11px]">71% WhatsApp - 12M Kenyans</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-[16px] border p-4"><div className="text-[10px] text-zinc-500">PROBLEM</div><div className="font-black text-sm mt-1">12M in WA groups, 0 accountability</div><div className="text-[11px] text-zinc-500 mt-1">Complaints die in WhatsApp. No data for NGOs.</div></div>
          <div className="bg-white rounded-[16px] border p-4"><div className="text-[10px] text-zinc-500">SOLUTION</div><div className="font-black text-sm mt-1">AI + 6 reporters Siongiroi</div><div className="text-[11px] text-zinc-500 mt-1">Anonymize public WA, FB, X, TikTok. Swahili NLP daily.</div></div>
          <div className="bg-[#FF4D00] rounded-[16px] border p-4 text-white"><div className="text-[10px] opacity-80">TRACTION</div><div className="font-black text-sm mt-1">234 reports - Bomet</div><div className="text-[11px] opacity-90 mt-1">Peak 7-9PM after barazas. #roads 78% negative.</div></div>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div className="bg-white rounded-[20px] border p-5">
            <div className="text-[11px] text-zinc-500">STARTER</div>
            <div className="text-2xl font-black mt-1">$250<span className="text-sm font-normal text-zinc-500"> / county</span></div>
            <div className="mt-4 space-y-2 text-[12px]"><div>✅ Weekly PDF report</div><div>✅ WhatsApp alerts</div><div>✅ 50 leaders sentiment</div><div>✅ Logo on dashboard</div></div>
            <a href="https://wa.me/254700000000?text=Sponsor%20Bomet%20$250" className="mt-5 block text-center h-10 grid place-items-center rounded-full bg-zinc-900 text-white text-[12px] font-bold">Sponsor Bomet</a>
          </div>
          <div className="bg-zinc-900 rounded-[20px] border p-5 text-white ring-2 ring-[#FF4D00] relative">
            <div className="absolute top-0 right-0 px-3 py-1 bg-[#FF4D00] text-white text-[10px] font-bold rounded-bl-xl">POPULAR</div>
            <div className="text-[11px] opacity-60">GROWTH - 5 COUNTIES</div>
            <div className="text-2xl font-black mt-1">$1,000<span className="text-sm font-normal opacity-60"> / mo</span></div>
            <div className="mt-4 space-y-2 text-[12px] opacity-90"><div>✅ Everything in Starter x5</div><div>✅ USSD *384* access</div><div>✅ Daily digest</div><div>✅ API + press charts</div></div>
            <a href="https://wa.me/254700000000?text=Sponsor%205%20Counties%20$1000" className="mt-5 block text-center h-10 grid place-items-center rounded-full bg-[#FF4D00] text-white text-[12px] font-bold">Sponsor 5 Counties</a>
          </div>
          <div className="bg-white rounded-[20px] border p-5">
            <div className="text-[11px] text-zinc-500">NATIONAL</div>
            <div className="text-2xl font-black mt-1">$3,500<span className="text-sm font-normal text-zinc-500"> / mo</span></div>
            <div className="mt-4 space-y-2 text-[12px]"><div>✅ All 47 counties</div><div>✅ Custom NLP</div><div>✅ Assembly presentation</div><div>✅ White-label</div></div>
            <a href="https://wa.me/254700000000?text=National%20$3500" className="mt-5 block text-center h-10 grid place-items-center rounded-full border border-zinc-900 text-[12px] font-bold">Book Call</a>
          </div>
        </div>

        <div className="rounded-[20px] bg-[#0A1931] text-white p-5 flex justify-between items-center">
          <div><div className="font-black">Built in Siongiroi, for all 47 counties.</div><div className="text-xs opacity-70">civiclens-six-psi.vercel.app - Bomet pilot free</div></div>
          <a href="/" className="px-4 py-2 rounded-full bg-white text-black text-xs font-bold">View Dashboard</a>
        </div>
      </div>
    </div>
  )
}
