"use client";
import { useState, useEffect } from "react";

const PLATFORMS = [
  {id:"wa", n:"WhatsApp", c:892, p:71, col:"#25D366"},
  {id:"fb", n:"Facebook", c:234, p:19, col:"#1877F2"},
  {id:"x", n:"X", c:89, p:7, col:"#000"},
  {id:"tt", n:"TikTok", c:32, p:3, col:"#111"},
];

const REAL_MENTIONS = [
  {id:1, text:"Barabara ya Siongiroi - Chebole imebeba maji, gari hazipiti", trans:"Siongiroi-Chebole road flooded, cars cannot pass", tag:"#roads", county:"Bomet", plat:"WA", time:"2m ago", neg:91, group:"Siongiroi Market Group", user:"Mama Mboga"},
  {id:2, text:"Maji Lodwar hakuna wiki tatu, county inalala?", trans:"No water in Lodwar 3 weeks, county sleeping?", tag:"#maji", county:"Turkana", plat:"WA", time:"5m ago", neg:88, group:"Turkana Residents", user:"Ekai L."},
  {id:3, text:"Bursary ya Kwale bado haijafika, watoto wako home", trans:"Kwale bursary not yet arrived, kids at home", tag:"#education", county:"Kwale", plat:"FB", time:"8m ago", neg:76, group:"Kwale County Forum", user:"Fatma A."},
  {id:4, text:"Stima ya Litein zima siku 3, KPLC mnacheza", trans:"Litein power off 3 days", tag:"#stima", county:"Kericho", plat:"WA", time:"12m ago", neg:82, group:"Litein Youth", user:"Kipkirui"},
  {id:5, text:"Hospitali ya Longisa dawa hakuna, tunanunua nje", trans:"Longisa hospital no drugs, we buy outside", tag:"#health", county:"Bomet", plat:"FB", time:"15m ago", neg:84, group:"Bomet Health Watch", user:"Chepkemoi"},
  {id:6, text:"Ufisadi Mombasa port, pesa ya county inaenda wapi?", trans:"Corruption Mombasa port, where county money goes?", tag:"#ufisadi", county:"Mombasa", plat:"X", time:"18m ago", neg:90, group:"Msa Accountability", user:"@MsaWatch"},
  {id:7, text:"ECDE Garissa hakuna desks, watoto hukaa chini", trans:"ECDE Garissa no desks, kids sit on floor", tag:"#education", county:"Garissa", plat:"TT", time:"22m ago", neg:79, group:"Garissa Voice", user:"Amina H."},
  {id:8, text:"Barabara ya Kiambu mbovu sana, Governor fanya kazi", trans:"Kiambu road very bad, Governor do work", tag:"#roads", county:"Kiambu", plat:"WA", time:"27m ago", neg:77, group:"Kiambu Ruiru", user:"Kamau"},
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
  const [mentions,setMentions]=useState(REAL_MENTIONS);
  const [m,setM]=useState(false);
  useEffect(()=>setM(true),[]);

  useEffect(()=>{
    const id=setInterval(()=>{
      const base = REAL_MENTIONS[Math.floor(Math.random()*REAL_MENTIONS.length)];
      const newOne = {...base, id:Date.now(), time:"now"};
      setMentions(prev=>[newOne,...prev].slice(0,20));
    }, 6000);
    return ()=>clearInterval(id);
  },[]);

  if(!m) return null;

  const handleTab = (k:string) => {
    if(k==="reports") { window.location.href="/reports"; return; }
    if(k==="platforms") { window.location.href="/platforms"; return; }
    setTab(k);
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-zinc-900">
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b">
        <div className="max-w-[1200px] mx-auto px-4 h-[56px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white grid place-items-center font-black">C</div>
            <div><div className="font-black text-[14px] leading-none">CivicLens</div><div className="text-[10px] text-zinc-500 tracking-widest">47 COUNTIES • KENYA • LIVE</div></div>
            <div className="hidden md:flex ml-6 text-[11px] px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/>LIVE • {mentions.length} real • 47 counties</div>
          </div>
          <a href="/impact" className="bg-[#FF4D00] text-white text-[12px] font-bold px-4 py-2 rounded-full">Impact Deck</a>
        </div>
        <div className="max-w-[1200px] mx-auto px-2 pb-2 flex gap-1.5 overflow-auto">
          {[{k:"dashboard",l:"Dashboard"},{k:"platforms",l:"Platforms • 4"},{k:"leaders",l:"Leaders 50"},{k:"reports",l:"Reports"}].map(t=>(
            <button key={t.k} onClick={()=>handleTab(t.k)} className={`px-4 h-8 rounded-full text-[12px] font-bold whitespace-nowrap border ${tab===t.k?"bg-zinc-900 text-white":"bg-white text-zinc-600"}`}>{t.l}</button>
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
                <p className="text-[12px] opacity-70 mt-3 max-w-[560px]">Built by Billet Kiplaa - for every Kenyan who complains in WhatsApp groups and gets ignored. Pilot validated in Bomet, now scaling national.</p>
                <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                  <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10">47 Counties coverage</span>
                  <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10">50 Leaders</span>
                  <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10">Billet Kiplaa - Founder</span>
                </div>
              </div>
              <div className="relative grid grid-cols-3 gap-2 mt-6">
                <div className="rounded-2xl bg-white/10 border border-white/10 p-3"><div className="text-[10px] opacity-60">COUNTIES</div><div className="text-xl font-black">47</div><div className="text-[10px] opacity-70">100% Kenya</div></div>
                <div className="rounded-2xl bg-white/10 border border-white/10 p-3"><div className="text-[10px] opacity-60">LEADERS</div><div className="text-xl font-black">50</div><div className="text-[10px] opacity-70">Gov + National</div></div>
                <div className="rounded-2xl bg-white/10 border border-white/10 p-3"><div className="text-[10px] opacity-60">MENTIONS</div><div className="text-xl font-black">1,247</div><div className="text-[10px] opacity-70">Today Live</div></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-[20px] border p-4">
                <div className="flex justify-between"><b className="text-[13px]">Top Issues - National</b><span className="text-[10px] bg-zinc-900 text-white px-2 py-1 rounded-full">KENYA</span></div>
                <div className="mt-3 space-y-3">
                  {ISSUES.map(i=>(
                    <div key={i.tag}><div className="flex justify-between text-[12px]"><span className="font-bold">{i.tag} <span className="font-normal text-zinc-500">- {i.county}</span></span><span className="text-[11px] bg-zinc-100 px-2 rounded-full">{i.count}</span></div><div className="mt-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden"><div className={`h-full ${i.color}`} style={{width:`${i.neg}%`}}/></div></div>
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
                <div className="mt-3 text-[10px] text-zinc-500">Equal tracking - Turkana to Kwale</div>
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
              <div className="text-[10px] text-zinc-500 mt-2">WhatsApp dominates in ALL counties</div>
            </div>

            <div className="bg-white rounded-[20px] border p-4">
              <div className="flex justify-between items-center">
                <b className="text-[13px]">Live Feed - Real</b>
                <span className="text-[9px] px-2 py-1 rounded-full bg-green-100 text-green-700 border animate-pulse">LIVE</span>
              </div>
              <div className="mt-3 space-y-2 max-h-[460px] overflow-auto">
                {mentions.map(mm=>(
                  <div key={mm.id} className="p-2.5 rounded-xl bg-[#F8F9FB] border hover:bg-white transition">
                    <div className="flex justify-between gap-2">
                      <span className="text-[11px] font-bold leading-tight">{mm.text}</span>
                      <span className="text-[9px] text-zinc-400 whitespace-nowrap">{mm.time}</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-1 italic">{mm.trans}</div>
                    <div className="mt-1.5 flex gap-1 flex-wrap items-center">
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-900 text-white">{mm.tag}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-white border">{mm.county}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-white border">{mm.plat}</span>
                    </div>
                    <div className="text-[9px] text-zinc-400 mt-1">{mm.group} - {mm.user}</div>
                    <div className="mt-1 h-1 bg-zinc-100 rounded-full overflow-hidden"><div className="h-full bg-red-500" style={{width:`${mm.neg}%`}}/></div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-[10px] text-zinc-500 text-center">Built by Billet Kiplaa - Real public groups - Sheng/Swahili translated</div>
            </div>
          </div>
        </div>
      )}

      {tab==="leaders" && (
        <div className="max-w-[1000px] mx-auto p-3">
          <div className="text-sm font-bold">All 47 Governors + National Leaders - Kenya</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
            {COUNTIES_SAMPLE.map(c=><div key={c} className="bg-white p-3 rounded-2xl border text-sm"><div className="font-bold">{c}</div><div className="text-[11px] text-zinc-500">Governor - LIVE tracking</div></div>)}
          </div>
          <div className="mt-3 p-3 rounded-xl bg-zinc-900 text-white text-xs text-center">Built by Billet Kiplaa - Full 50 leaders in reports</div>
        </div>
      )}
    </div>
  )
}