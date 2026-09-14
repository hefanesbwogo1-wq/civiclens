"use client";
import { useState, useEffect } from "react";

const PLATFORMS = [
  {id:"wa", n:"WhatsApp", c:892, p:71, col:"#25D366", icon:"💬"},
  {id:"fb", n:"Facebook", c:234, p:19, col:"#1877F2", icon:"f"},
  {id:"x", n:"X", c:89, p:7, col:"#000", icon:"𝕏"},
  {id:"tt", n:"TikTok", c:32, p:3, col:"#111", icon:"♪"},
];

const ISSUES = [
  {tag:"#roads", count:234, neg:78, pos:8, county:"Bomet", color:"bg-red-500"},
  {tag:"#ufisadi", count:189, neg:82, pos:5, county:"Nairobi", color:"bg-orange-500"},
  {tag:"#maji", count:156, neg:71, pos:12, county:"Turkana", color:"bg-blue-500"},
  {tag:"#education", count:134, neg:55, pos:22, county:"Kisumu", color:"bg-emerald-500"},
];

export default function Page(){
  const [tab,setTab]=useState("dashboard");
  const [plat,setPlat]=useState("wa");
  const [m,setM]=useState(false);
  useEffect(()=>setM(true),[]);
  if(!m) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-zinc-900 antialiased">
      {/* HEADER */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b">
        <div className="max-w-[1200px] mx-auto px-4 h-[56px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white grid place-items-center font-black">C</div>
            <div><div className="font-black text-[14px] leading-none">CivicLens</div><div className="text-[10px] text-zinc-500 font-medium tracking-widest">SIONGIROI • PILOT LIVE</div></div>
            <div className="hidden md:flex items-center gap-2 ml-6">
              <div className="h-6 w-px bg-zinc-200" />
              <div className="text-[11px] px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/>LIVE • 1,247 mentions</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-[11px] hidden md:block text-zinc-500">47 Counties • 50 Leaders</div>
            <a href="/impact" className="bg-[#FF4D00] text-white text-[12px] font-bold px-4 py-2 rounded-full">Impact Deck →</a>
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto px-2 pb-2 flex gap-1.5 overflow-auto">
          {[
            {k:"dashboard", l:"Dashboard"},
            {k:"platforms", l:`Platforms • 4`},
            {k:"leaders", l:"Leaders 50"},
            {k:"reports", l:"Live Reports"},
          ].map(t=>(
            <button key={t.k} onClick={()=>t.k==="reports"?window.location.href="/reports":setTab(t.k)} className={`px-4 h-8 rounded-full text-[12px] font-bold whitespace-nowrap border transition ${tab===t.k?"bg-zinc-900 text-white border-zinc-900":"bg-white text-zinc-600 border-zinc-200 hover:border-zinc-900"}`}>{t.l}</button>
          ))}
        </div>
      </div>

      {tab==="dashboard" && (
        <div className="max-w-[1200px] mx-auto p-3 md:p-4 grid md:grid-cols-[1.6fr_0.9fr] gap-3">
          {/* LEFT */}
          <div className="space-y-3">
            <div className="rounded-[24px] bg-zinc-900 text-white p-5 md:p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#FF4D00]/20 blur-[80px] rounded-full" />
              <div className="relative">
                <div className="text-[11px] tracking-widest opacity-60">PUBLIC CONVERSATION INTELLIGENCE</div>
                <h1 className="text-[30px] md:text-[44px] font-black leading-[0.9] tracking-tight mt-2">We turn WhatsApp noise <br/>into <span className="text-[#FF4D00]">accountability.</span></h1>
                <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                  <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10">50 Leaders tracked</span>
                  <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10">Swahili • Sheng • Kalenjin</span>
                  <span className="px-2.5 py-1 rounded-full bg-[#25D366] text-black font-bold">Bomet Pilot LIVE</span>
                </div>
              </div>
              <div className="relative grid grid-cols-3 gap-2 mt-6">
                {[{k:"LEADERS",v:"50",s:"+3"},{k:"MENTIONS",v:"1,247",s:"+89 today"},{k:"ACCURACY",v:"94%",s:"Swahili NLP"}].map(c=>(
                  <div key={c.k} className="rounded-2xl bg-white/10 border border-white/10 p-3 backdrop-blur"><div className="text-[10px] opacity-60">{c.k}</div><div className="text-xl font-black">{c.v}</div><div className="text-[10px] opacity-70">{c.s}</div></div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-[20px] border p-4">
                <div className="flex justify-between"><b className="text-[13px]">Trending Issues</b><span className="text-[10px] bg-zinc-900 text-white px-2 py-1 rounded-full">LIVE</span></div>
                <div className="mt-3 space-y-3">
                  {ISSUES.map(i=>(
                    <div key={i.tag} className="group">
                      <div className="flex justify-between text-[12px]"><span className="font-bold">{i.tag} <span className="font-normal text-zinc-500">• {i.county}</span></span><span className="text-[11px] bg-zinc-100 px-2 py-0.5 rounded-full">{i.count} </span></div>
                      <div className="mt-1.5 h-2 bg-zinc-100 rounded-full overflow-hidden flex"><div className={`h-full ${i.color}`} style={{width:`${i.neg}%`}}/><div className="h-full bg-zinc-200" style={{width:`${100-i.neg-i.pos}%`}}/><div className="h-full bg-green-500" style={{width:`${i.pos}%`}}/></div>
                      <div className="flex justify-between text-[9px] text-zinc-500 mt-1"><span>{i.neg}% negative</span><span>{i.pos}% positive</span></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-[20px] border p-4 flex flex-col">
                <b className="text-[13px]">Platform Mix</b>
                <div className="mt-3 flex justify-center">
                  <div className="w-28 h-28 rounded-full" style={{background:`conic-gradient(#25D366 0% 71%, #1877F2 71% 90%, #000 90% 97%, #444 97% 100%)`}} />
                </div>
                <div className="mt-3 space-y-1.5">
                  {PLATFORMS.map(p=>(
                    <button key={p.id} onClick={()=>{setPlat(p.id); setTab("platforms")}} className={`w-full flex justify-between items-center text-[11px] px-2 py-1.5 rounded-full border ${plat===p.id?"bg-zinc-900 text-white border-zinc-900":"bg-zinc-50 border-zinc-100"}`}><span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full grid place-items-center text-[10px]" style={{background:p.col,color:"white"}}>{p.icon}</span>{p.n}</span><b>{p.p}%</b></button>
                  ))}
                </div>
                <div className="mt-auto pt-3 text-[10px] text-zinc-500">WhatsApp = 71% of all mentions. Peak 7-9PM after barazas.</div>
              </div>
            </div>

            <div className="bg-white rounded-[20px] border p-4">
              <div className="flex justify-between items-center"><b className="text-[13px]">47 Counties Coverage</b><a href="/reports" className="text-[11px] underline">View full map</a></div>
              <div className="grid grid-cols-8 md:grid-cols-12 gap-1 mt-3">
                {Array.from({length:47}).map((_,i)=>(
                  <div key={i} className={`h-6 rounded-lg grid place-items-center text-[8px] font-bold border ${i===31?"bg-[#FF4D00] text-white border-[#FF4D00] ring-2 ring-orange-200":i%3===0?"bg-zinc-900 text-white":"bg-zinc-100 text-zinc-500"}`}>{i+1}</div>
                ))}
              </div>
              <div className="flex gap-2 mt-3 text-[10px]"><span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#FF4D00]"/>Bomet Pilot</span><span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-zinc-900"/>High activity</span><span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-zinc-100 border"/>Low</span></div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-3">
            <div className="bg-white rounded-[20px] border p-4">
              <b className="text-[13px]">Live WhatsApp Feed</b><span className="ml-2 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">Anonymized</span>
              <div className="mt-3 space-y-2">
                {[
                  {t:"Barabara ya Siongiroi-Chebole mbaya sana, mchanga tu", tag:"#roads", co:"Bomet", time:"2m", sent:"neg"},
                  {t:"Maji hakuna Sotik kwa wiki tatu, county inafanya nini?", tag:"#maji", co:"Bomet", time:"11m", sent:"neg"},
                  {t:"Bursary ya county haijafika shule yetu Kapletundo", tag:"#education", co:"Bomet", time:"24m", sent:"neg"},
                  {t:"Sakaja amejenga park poa CBD though", tag:"#roads", co:"Nairobi", time:"42m", sent:"pos"},
                ].map((m,i)=>(
                  <div key={i} className="p-2.5 rounded-2xl bg-[#F8F9FB] border border-zinc-100 text-[12px] leading-snug">
                    “{m.t}”
                    <div className="flex gap-1 mt-1.5"><span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${m.sent==="neg"?"bg-red-100 text-red-700":"bg-green-100 text-green-700"}`}>{m.sent}</span><span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white border">{m.tag}</span><span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white border">{m.co}</span><span className="text-[9px] text-zinc-400 ml-auto">{m.time}</span></div>
                  </div>
                ))}
              </div>
              <button onClick={()=>setTab("platforms")} className="w-full mt-3 h-9 rounded-full bg-zinc-900 text-white text-[12px] font-bold">View all platforms →</button>
            </div>

            <div className="bg-white rounded-[20px] border p-4">
              <b className="text-[13px]">Sentiment Breakdown</b>
              <div className="mt-3 flex items-end gap-1 h-20">
                <div className="flex-1 bg-red-100 rounded-t-xl relative" style={{height:"62%"}}><div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold">62%</div><div className="absolute bottom-0 w-full h-2 bg-red-500 rounded-t-xl"/></div>
                <div className="flex-1 bg-zinc-100 rounded-t-xl relative" style={{height:"22%"}}><div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold">22%</div></div>
                <div className="flex-1 bg-green-100 rounded-t-xl relative" style={{height:"16%"}}><div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold">16%</div><div className="absolute bottom-0 w-full h-2 bg-green-500 rounded-t-xl"/></div>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px] text-center mt-2 text-zinc-500"><span>Negative</span><span>Neutral</span><span>Positive</span></div>
            </div>

            <div className="rounded-[20px] bg-[#0A1931] text-white p-4">
              <div className="text-[10px] tracking-widest opacity-60">SPONSOR IMPACT</div>
              <div className="font-bold mt-1">Sponsor a County — $250</div>
              <div className="text-[12px] opacity-80 mt-1">Get weekly PDF + USSD alerts for your county. Bomet pilot free.</div>
              <a href="/impact" className="mt-3 inline-flex h-9 px-4 rounded-full bg-[#FF4D00] text-white text-[12px] font-bold items-center">View Impact Deck →</a>
            </div>
          </div>
        </div>
      )}

      {tab==="platforms" && (
        <div className="max-w-[1000px] mx-auto p-3 grid md:grid-cols-[280px_1fr] gap-3">
          <div className="bg-white rounded-[20px] border p-3 h-fit">
            <b className="text-sm">Sources</b>
            <div className="mt-3 space-y-2">
              {PLATFORMS.map(p=>(
                <button key={p.id} onClick={()=>setPlat(p.id)} className={`w-full text-left p-3 rounded-2xl border flex justify-between ${plat===p.id?"bg-zinc-900 text-white border-zinc-900":"bg-white hover:border-zinc-900"}`}>
                  <div><div className="font-bold text-[13px] flex items-center gap-2"><span className="w-6 h-6 rounded-full grid place-items-center text-[11px]" style={{background:p.col,color:"white"}}>{p.icon}</span>{p.n}</div><div className="text-[11px] opacity-70">{p.c} mentions</div></div><div className="text-[12px] font-black">{p.p}%</div>
                </button>
              ))}
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px]"><b>Why WhatsApp?</b><br/>12M Kenyans in public groups. No official API. We built collector + 6 citizen reporters in Siongiroi.</div>
            </div>
          </div>
          <div className="bg-white rounded-[20px] border p-5">
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-zinc-900 text-white grid place-items-center font-bold">{PLATFORMS.find(x=>x.id===plat)?.icon}</div><div><div className="font-black">{PLATFORMS.find(x=>x.id===plat)?.n} Intelligence</div><div className="text-[12px] text-zinc-500">71% of all conversation • Peak 7-9PM • Swahili/Sheng/Kalenjin</div></div></div>
            <div className="mt-4 h-2 bg-zinc-100 rounded-full overflow-hidden"><div className="h-full bg-zinc-900" style={{width:`${PLATFORMS.find(x=>x.id===plat)?.p}%`}} /></div>
            <div className="mt-5 grid md:grid-cols-3 gap-2">
              <div className="p-3 rounded-2xl bg-zinc-50 border"><div className="text-[10px] text-zinc-500">LANGUAGE MIX</div><div className="text-[12px] font-bold mt-1">Swahili 45%<br/>Sheng 30%<br/>Kalenjin 15%<br/>English 10%</div></div>
              <div className="p-3 rounded-2xl bg-zinc-50 border"><div className="text-[10px] text-zinc-500">TOP KEYWORDS</div><div className="text-[12px] font-bold mt-1">#roads<br/>#ufisadi<br/>#maji<br/>barabara / maji</div></div>
              <div className="p-3 rounded-2xl bg-zinc-50 border"><div className="text-[10px] text-zinc-500">TRUST & VERIFICATION</div><div className="text-[12px] font-bold mt-1">High • Public groups<br/>Anonymized<br/>6 reporters Siongiroi</div></div>
            </div>
            <div className="mt-4 p-3 rounded-2xl bg-[#F8F9FB] border text-[13px]">Latest sample: “Barabara ya Siongiroi-Chebole mbaya sana, mchanga tu” <div className="text-[11px] text-zinc-500 mt-1">#roads • Bomet • 2m ago • Sentiment: Negative • Source: {PLATFORMS.find(x=>x.id===plat)?.n}</div></div>
          </div>
        </div>
      )}

      {tab==="leaders" && (
        <div className="max-w-[1000px] mx-auto p-3">
          <div className="bg-white rounded-full border p-1 flex items-center gap-2"><input placeholder="Search county or leader e.g. Bomet, Sakaja" className="flex-1 px-4 py-2 text-sm outline-none rounded-full"/><span className="text-[11px] bg-zinc-900 text-white px-3 py-1.5 rounded-full mr-1">50 LIVE</span></div>
          <div className="grid md:grid-cols-2 gap-2 mt-3">
            {[
              {name:"Hillary Barchok", county:"Bomet", tag:"#roads 234", hl:true},
              {name:"Johnson Sakaja", county:"Nairobi", tag:"#ufisadi 189"},
              {name:"George Natembeya", county:"Trans Nzoia", tag:"#maji 98"},
              {name:"Susan Kihika", county:"Nakuru", tag:"#education 76"},
              {name:"William Ruto", county:"National", tag:"#ufisadi 210"},
              {name:"Anyang Nyongo", county:"Kisumu", tag:"#roads 67"},
            ].map(l=>(
              <div key={l.name} className={`bg-white p-3 rounded-2xl border flex justify-between ${l.hl?"ring-2 ring-[#FF4D00] border-[#FF4D00]":""}`}><div><div className="font-bold text-sm">{l.name} {l.hl&&<span className="text-[9px] bg-[#FF4D00] text-white px-2 py-0.5 rounded-full ml-1">PILOT</span>}</div><div className="text-[11px] text-zinc-500">{l.county} • {l.tag}</div></div><span className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded-full h-fit border border-green-200">LIVE</span></div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
