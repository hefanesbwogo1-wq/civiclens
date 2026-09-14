"use client";

export default function Impact(){
  return (
    <div className="min-h-screen bg-[#F8F9FB] text-zinc-900">
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b">
        <div className="max-w-[1000px] mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2"><div className="w-8 h-8 rounded-xl bg-zinc-900 text-white grid place-items-center font-black">C</div><div className="font-black text-sm">CivicLens</div><span className="text-[10px] px-2 py-1 rounded-full bg-zinc-100 ml-2">Impact Deck</span></div>
          <div className="flex gap-2"><a href="/" className="text-xs px-3 py-1.5 rounded-full border bg-white">← Dashboard</a><a href="/reports" className="text-xs px-3 py-1.5 rounded-full bg-zinc-900 text-white">Live Reports</a></div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto p-3 md:p-4 space-y-4">
        {/* HERO SAME AS DASHBOARD */}
        <div className="rounded-[24px] bg-zinc-900 text-white p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#FF4D00]/20 blur-[80px] rounded-full" />
          <div className="relative">
            <div className="text-[11px] tracking-widest opacity-60">SPONSOR IMPACT • SIONGIROI PILOT</div>
            <h1 className="text-[32px] md:text-[48px] font-black leading-[0.9] tracking-tight mt-3">From WhatsApp noise to <span className="text-[#FF4D00]">county action.</span></h1>
            <p className="text-[14px] opacity-80 mt-3 max-w-[600px]">We track public conversation about 50 leaders across 47 counties in Swahili, Sheng, Kalenjin. Bomet pilot live with 6 citizen reporters in Siongiroi. Now scaling.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <div className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[11px]"><b>50</b> Leaders tracked</div>
              <div className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[11px]"><b>1,247</b> mentions • LIVE</div>
              <div className="px-3 py-1.5 rounded-full bg-[#25D366] text-black font-bold text-[11px]">71% WhatsApp • 12M Kenyans in public groups</div>
            </div>
          </div>
        </div>

        {/* STATS ROW LIKE DASHBOARD */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-[16px] border p-4"><div className="text-[10px] text-zinc-500 tracking-widest">PROBLEM</div><div className="font-black text-sm mt-1">12M in WA groups, 0 accountability</div><div className="text-[11px] text-zinc-500 mt-1">Barabara, maji, ufisadi complaints die in WhatsApp. No tracking, no data for NGOs, media, counties.</div></div>
          <div className="bg-white rounded-[16px] border p-4"><div className="text-[10px] text-zinc-500 tracking-widest">SOLUTION</div><div className="font-black text-sm mt-1">AI + 6 reporters Siongiroi</div><div className="text-[11px] text-zinc-500 mt-1">We anonymize public WA, FB, X, TikTok. Swahili NLP → Sentiment → County report. Daily.</div></div>
          <div className="bg-[#FF4D00] rounded-[16px] border border-[#FF4D00] p-4 text-white"><div className="text-[10px] tracking-widest opacity-80">TRACTION - BOMET</div><div className="font-black text-sm mt-1">234 reports • 71% WhatsApp</div><div className="text-[11px] opacity-90 mt-1">Peak 7-9PM after barazas. #roads 78% negative. Pilot free, community loves it.</div></div>
        </div>

        {/* SPONSOR TIERS - THE MONEY CARDS */}
        <div className="grid md:grid-cols-3 gap-3">
          <div className="bg-white rounded-[20px] border p-5">
            <div className="text-[11px] tracking-widest text-zinc-500">STARTER</div>
            <div className="text-2xl font-black mt-1">$250<span className="text-sm font-normal text-zinc-500"> / county / month</span></div>
            <div className="mt-4 space-y-2 text-[12px]">
              <div className="flex gap-2"><span>✅</span> Weekly PDF report (your county)</div>
              <div className="flex gap-2"><span>✅</span> WhatsApp alerts (top 3 issues)</div>
              <div className="flex gap-2"><span>✅</span> 50 leaders sentiment</div>
              <div className="flex gap-2"><span>✅</span> Logo on dashboard</div>
            </div>
            <a href="https://wa.me/254700000000?text=Sponsor%20Bomet%20$250" className="mt-5 block text-center h-10 grid place-items-center rounded-full bg-zinc-900 text-white text-[12px] font-bold">Sponsor Bomet →</a>
          </div>

          <div className="bg-zinc-900 rounded-[20px] border border-zinc-900 p-5 text-white relative overflow-hidden ring-2 ring-[#FF4D00]">
            <div className="absolute top-0 right-0 px-3 py-1 bg-[#FF4D00] text-white text-[10px] font-bold rounded-bl-xl">MOST POPULAR</div>
            <div className="text-[11px] tracking-widest opacity-60">GROWTH - 5 COUNTIES</div>
            <div className="text-2xl font-black mt-1">$1,000<span className="text-sm font-normal opacity-60"> / mo</span></div>
            <div className="mt-4 space-y-2 text-[12px] opacity-90">
              <div className="flex gap-2"><span>✅</span> Everything in Starter x5</div>
              <div className="flex gap-2"><span>✅</span> USSD *384* access for citizens</div>
              <div className="flex gap-2"><span>✅</span> Daily Slack / Email digest</div>
              <div className="flex gap-2"><span>✅</span> Press-ready charts + API</div>
              <div className="flex gap-2"><span className="text-[#FF4D00]">🔥</span> Media partners call you source</div>
            </div>
            <a href="https://wa.me/254700000000?text=Sponsor%205%20Counties%20$1000" className="mt-5 block text-center h-10 grid place-items-center rounded-full bg-[#FF4D00] text-white text-[12px] font-bold">Sponsor 5 Counties →</a>
          </div>

          <div className="bg-white rounded-[20px] border p-5">
            <div className="text-[11px] tracking-widest text-zinc-500">NATIONAL</div>
            <div className="text-2xl font-black mt-1">$3,500<span className="text-sm font-normal text-zinc-500"> / mo</span></div>
            <div className="mt-4 space-y-2 text-[12px]">
              <div className="flex gap-2"><span>✅</span> All 47 counties • 50 leaders</div>
              <div className="flex gap-2"><span>✅</span> Custom NLP (Kalenjin, Somali)</div>
              <div className="flex gap-2"><span>✅</span> County assembly presentation</div>
              <div className="flex gap-2"><span>✅</span> White-label for your NGO</div>
            </div>
            <a href="https://wa.me/254700000000?text=National%20$3500" className="mt-5 block text-center h-10 grid place-items-center rounded-full bg-white border border-zinc-900 text-zinc-900 text-[12px] font-bold">Book Call →</a>
          </div>
        </div>

        {/* WHY NOW */}
        <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-3">
          <div className="bg-white rounded-[20px] border p-5">
            <b className="text-sm">Why NGOs pay now</b>
            <div className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
              <div className="p-3 rounded-xl bg-[#F8F9FB] border"><b>Before CivicLens</b><br/><span className="text-zinc-500">No data. Anecdotal field visits. $5k baseline surveys. 3 months late.</span></div>
              <div className="p-3 rounded-xl bg-green-50 border border-green-200"><b>After CivicLens</b><br/><span className="text-green-800">Daily sentiment. 94% Swahili accuracy. $250/mo. Citizens feel heard.</span></div>
            </div>
            <div className="mt-4 p-3 rounded-xl bg-zinc-900 text-white text-[12px]">“Bomet pilot proved 71% of accountability talk happens in WhatsApp, not Twitter. We were looking in wrong place.” <div className="text-[10px] opacity-60 mt-1">— Pilot insight, Siongiroi reporters</div></div>
          </div>

          <div className="bg-white rounded-[20px] border p-5">
            <b className="text-sm">Live Sample - Bomet</b>
            <div className="mt-3 space-y-2 text-[12px]">
              <div className="p-2.5 rounded-xl bg-[#F8F9FB] border">“Barabara ya Siongiroi-Chebole mbaya sana” <div className="text-[10px] text-zinc-500">#roads • 2m ago • neg • WA</div></div>
              <div className="p-2.5 rounded-xl bg-[#F8F9FB] border">“Maji hakuna Sotik kwa wiki tatu” <div className="text-[10px] text-zinc-500">#maji • 11m ago • neg • WA</div></div>
            </div>
            <div className="mt-3 text-[11px] text-zinc-500">All anonymized. 6 reporters. Verified public groups only.</div>
          </div>
        </div>

        <div className="rounded-[20px] bg-[#0A1931] text-white p-5 flex flex-col md:flex-row justify-between items-center gap-3">
          <div><div className="font-black">Built in Siongiroi, for all 47 counties.</div><div className="text-xs opacity-70">Contact: civiclens.co.ke • WhatsApp pilot live • Sponsor Bomet today</div></div>
          <div className="flex gap-2"><a href="/" className="px-4 py-2 rounded-full bg-white text-black text-xs font-bold">View Dashboard</a><a href="https://wa.me/254700000000?text=Sponsor%20County%20$250" className="px-4 py-2 rounded-full bg-[#FF4D00] text-white text-xs font-bold">Sponsor $250 →</a></div>
        </div>
      </div>
    </div>
  )
}
