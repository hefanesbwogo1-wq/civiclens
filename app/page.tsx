"use client";
import { useState, useEffect } from "react";

const PLATFORMS = [
  {id:"wa", n:"WhatsApp", c:892, p:71, col:"#25D366", icon:"💬"},
  {id:"fb", n:"Facebook", c:234, p:19, col:"#1877F2", icon:"f"},
  {id:"x", n:"X", c:89, p:7, col:"#000", icon:"𝕏"},
  {id:"tt", n:"TikTok", c:32, p:3, col:"#111", icon:"♪"},
];

const ISSUES = [
  {tag:"#roads", count:234, neg:78, county:"Kiambu", color:"bg-red-500"},
  {tag:"#ufisadi", count:189, neg:82, county:"Nairobi", color:"bg-orange-500"},
  {tag:"#maji", count:156, neg:71, county:"Turkana", color:"bg-blue-500"},
  {tag:"#education", count:134, neg:55, county:"Kisumu", color:"bg-emerald-500"},
  {tag:"#health", count:98, neg:68, county:"Mombasa", color:"bg-purple-500"},
];

const COUNTIES_SAMPLE = ["Mombasa","Kwale","Kilifi","Nairobi","Kiambu","Nakuru","Kisumu","Kakamega","Turkana","Bomet","Uasin Gishu","Migori","Machakos","Meru","Nyeri","Garissa"];

export default function Page(){
  const [tab,setTab]=useState("dashboard");
  const [plat,setPlat]=useState("wa");
  const [m,setM]=useState(false);
  useEffect(()=>setM(true),[]);
  if(!m) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-zinc-900">
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b">
        <div className="max-w-[1200px] mx-auto px-4 h-[56px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white grid place-items-center font-black">C</div>
            <div><div className="font-black text-[14px] leading-none">CivicLens</div><div className="text-[10px] text-zinc-500 tracking-widest">47 COUNTIES • KENYA • LIVE</div></div>
            <div className="hidden md:flex ml-6 text-[11px] px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/>LIVE • 1,247 mentions • 47 counties</div>
          </div>
          <a href="/impact" className="bg-[#FF4D00] text-white text-[12px] font-bold px-4 py-2 rounded-full">Impact Deck →</a>
        </div>
        <div className="max-w-[1200px] mx-auto px-2 pb-2 flex gap-1.5 overflow-auto">
          {[{k:"dashboard",l:"Dashboard"},{k:"platforms",l:`Platforms • 4`},{k:"leaders",l:"Leaders 50"},{k:"reports",l:"Reports"}].map(t=>(
            <button key={t.k} onClick={()=>t.k==="reports"?window.location.href="/reports":setTab(t.k)} className={`px-4 h-8 rounded-full text-[12px] font-bold whitespace-nowrap border ${tab===t.k?"bg-zinc-900 text-white":"bg-white text-zinc-600"}`}>{t.l}</button>
          ))}
        </div>
      </div>

      {tab==="dashboard" && (
        <div className="max-w-[1200px] mx-auto p-3 md:p-4 grid md:grid-cols-[1.6fr_0.9fr] gap-3">
          <div className="space-y-3">
            <div className="rounded-[24px] bg-zinc-900 text-white p-5 md:p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#FF4D00]/20 blur-[80px] rounded-full" />
              <div className="relative">
                <div className="text-[11px] tracking-widest opacity-60">KENYA PUBLIC CONVERSATION INTELLIGENCE</div>
                <h1 className="text-[30px] md:text-[44px] font-black leading-[0.9] mt-2">We turn public noise <br/>into <span className="text-[#FF4D00]">accountability.</span></h1>
                <p className="text-[12px] opacity-70 mt-2 max-w-[500px]">Tracking 50 leaders across all 47 counties. Swahili, Sheng, English. From Turkana to Kwale, Kisumu to Garissa.</p>
                <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                  <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10">47 Counties coverage</span>
                  <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10">50 Leaders • National + Governors</span>
                  <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10">Pilot validated in Bomet • Scaling national</span>
                </div>
              </div>
              <div className="relative grid grid-cols-3 gap-2 mt-6">
                <div className="rounded-2xl bg-white/10 border border-white/10 p-3"><div className="text-[10px] opacity-60">COUNTIES</div><div className="text-xl font-black">47</div><div className="text-[10px] opacity-70">100% Kenya</div></div>
                <div className="rounded-2xl bg-white/10 border border-white/10 p-3"><div className="text-[10px] opacity-60">LEADERS</div><div className="text-xl font-black">50</div><div className="text-[10px] opacity-70">Gov + President + DP</div></div>
                <div className="rounded-2xl bg-white/10 border border-white/10 p-3"><div className="text-[10px] opacity-60">MENTIONS</div><div className="text-xl font-black">1,247</div><div className="text-[10px] opacity-70">Today • All platforms</div></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-[20px] border p-4">
                <div className="flex justify-between"><b className="text-[13px]">Top Issues - National</b><span className="text-[10px] bg-zinc-900 text-white px-2 py-1 rounded-full">KENYA</span></div>
                <div className="mt-3 space-y-3">
                  {ISSUES.map(i=>(
                    <div key={i.tag}><div className="flex justify-between text-[12px]"><span className="font-bold">{i.tag} <span className="font-normal text-zinc-500">• {i.county}</span></span><span className="text-[11px] bg-zinc-100 px-2 rounded-full">{i.count}</span></div><div className="mt-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden"><div className={`h-full ${i.color}`} style={{width:`${i.neg}%`}}/></div></div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-[20px] border p-4 flex flex-col">
                <b className="text-[13px]">47 Counties Activity</b>
                <div className="mt-3 grid grid-cols-4 gap-1.5">
                  {Array.from({length:47}).map((_,i)=>(
                    <div key={i} className={`h-7 rounded-lg grid place-items-center text-[9px] font-bold ${i%5===0?"bg-zinc-900 text-white":i%3===0?"bg-orange-100 text-orange-700 border border-orange-200":"bg-zinc-100 text-zinc-600"}`}>{i+1}</div>
                  ))}
                </div>
                <div className="mt-3 text-[10px] text-zinc-500">Equal tracking • No county bias • Turkana to Kwale</div>
                <div className="mt-2 flex flex-wrap gap-1">{COUNTIES_SAMPLE.map(c=><span key={c} className="text-[9px] px-2 py-1 rounded-full bg-zinc-50 border">{c}</span>)}</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-white rounded-[20px] border p-4">
              <b className="text-[13px]">Platform Mix - Kenya</b>
              <div className="mt-3 flex justify-center"><div className="w-24 h-24 rounded-full" style={{background:`conic-gradient(#25D366 0% 71%, #1877F2 71% 90%, #000 90% 97%, #444 97% 100%)`}} /></div>
              <div className="mt-3 space-y-1">
                {PLATFORMS.map(p=><div key={p.id} className="flex justify-between text-[11px]"><span>{p.n}</span><b>{p.p}%</b></div>)}
              </div>
              <div className="text-[10px] text-zinc-500 mt-2">WhatsApp dominates in ALL counties, not just Bomet.</div>
            </div>
            <div className="bg-white rounded-[20px] border p-4">
              <b className="text-[13px]">Live Feed - National</b>
              <div className="mt-3 space-y-2 text-[12px]">
                <div className="p-2 rounded-xl bg-[#F8F9FB] border">“Barabara ya Kiambu mbovu sana” <span className="text-[9px] bg-zinc-100 px-1 rounded">#roads • Kiambu</span></div>
                <div className="p-2 rounded-xl bg-[#F8F9FB] border">“Maji Lodwar hakuna wiki tatu” <span className="text-[9px] bg-zinc-100 px-1 rounded">#maji • Turkana</span></div>
                <div className="p-2 rounded-xl bg-[#F8F9FB] border">“Bursary Kwale haijafika” <span className="text-[9px] bg-zinc-100 px-1 rounded">#education • Kwale</span></div>
                <div className="p-2 rounded-xl bg-[#F8F9FB] border">“Ufisadi Mombasa port” <span className="text-[9px] bg-zinc-100 px-1 rounded">#ufisadi • Mombasa</span></div>
              </div>
              <div className="mt-2 text-[10px] text-zinc-500">Pilot validated in Siongiroi, Bomet — now national model.</div>
            </div>
          </div>
        </div>
      )}

      {tab==="platforms" && (
        <div className="max-w-[1000px] mx-auto p-3">
          <h2 className="font-black text-xl">Platforms - Kenya Wide</h2>
          <p className="text-xs text-zinc-500">Where Kenyans talk — same pattern in all 47 counties</p>
          <div className="grid md:grid-cols-4 gap-2 mt-3">
            {PLATFORMS.map(p=>(
              <div key={p.id} className="bg-white rounded-2xl border p-4"><div className="w-8 h-8 rounded-full grid place-items-center text-white" style={{background:p.col}}>{p.icon}</div><div className="font-bold mt-2">{p.n}</div><div className="text-xs text-zinc-500">{p.c} mentions • {p.p}% national</div></div>
            ))}
          </div>
        </div>
      )}

      {tab==="leaders" && (
        <div className="max-w-[1000px] mx-auto p-3">
          <div className="text-sm font-bold">All 47 Governors + National Leaders — Kenya</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
            {COUNTIES_SAMPLE.map(c=><div key={c} className="bg-white p-3 rounded-2xl border text-sm"><div className="font-bold">{c}</div><div className="text-[11px] text-zinc-500">Governor • LIVE tracking</div></div>)}
          </div>
          <div className="mt-3 p-3 rounded-xl bg-zinc-900 text-white text-xs text-center">Full 50 leaders list in reports — Turkana to Kwale, all equal.</div>
        </div>
      )}
    </div>
  )
}
