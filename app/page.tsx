"use client";
import { useState, useEffect } from "react";

const GOVERNORS = [
  {name:"Abdulswamad Nassir", county:"Mombasa"}, {name:"Fatuma Achani", county:"Kwale"}, {name:"Gideon Mung'aro", county:"Kilifi"},
  {name:"Dhadho Godhana", county:"Tana River"}, {name:"Issa Timamy", county:"Lamu"}, {name:"Andrew Mwadime", county:"Taita Taveta"},
  {name:"Nathif Jama", county:"Garissa"}, {name:"Ahmed Abdullahi", county:"Wajir"}, {name:"Mohamed Khalif", county:"Mandera"},
  {name:"Mohamud Ali", county:"Marsabit"}, {name:"Abdi Guyo", county:"Isiolo"}, {name:"Mutuma M'Ethingia", county:"Meru"},
  {name:"Muthomi Njuki", county:"Tharaka Nithi"}, {name:"Cecily Mbarire", county:"Embu"}, {name:"Julius Malombe", county:"Kitui"},
  {name:"Wavinya Ndeti", county:"Machakos"}, {name:"Mutula Kilonzo Jr", county:"Makueni"}, {name:"Moses Badilisha", county:"Nyandarua"},
  {name:"Mutahi Kahiga", county:"Nyeri"}, {name:"Anne Waiguru", county:"Kirinyaga"}, {name:"Irungu Kang'ata", county:"Murang'a"},
  {name:"Kimani Wamatangi", county:"Kiambu"}, {name:"Jeremiah Lomorukai", county:"Turkana"}, {name:"Simon Kachapin", county:"West Pokot"},
  {name:"Jonathan Lelelit", county:"Samburu"}, {name:"George Natembeya", county:"Trans Nzoia"}, {name:"Jonathan Bii", county:"Uasin Gishu"},
  {name:"Wisley Rotich", county:"Elgeyo Marakwet"}, {name:"Stephen Sang", county:"Nandi"}, {name:"Benjamin Cheboi", county:"Baringo"},
  {name:"Joshua Irungu", county:"Laikipia"}, {name:"Susan Kihika", county:"Nakuru"}, {name:"Patrick Ntutu", county:"Narok"},
  {name:"Joseph Ole Lenku", county:"Kajiado"}, {name:"Erick Mutai", county:"Kericho"}, {name:"Hillary Barchok", county:"Bomet", highlight:true},
  {name:"Fernandes Barasa", county:"Kakamega"}, {name:"Wilber Ottichilo", county:"Vihiga"}, {name:"Kenneth Lusaka", county:"Bungoma"},
  {name:"Paul Otuoma", county:"Busia"}, {name:"James Orengo", county:"Siaya"}, {name:"Anyang Nyongo", county:"Kisumu"},
  {name:"Gladys Wanga", county:"Homa Bay"}, {name:"Ochilo Ayacko", county:"Migori"}, {name:"Simba Arati", county:"Kisii"},
  {name:"Amos Nyaribo", county:"Nyamira"}, {name:"Johnson Sakaja", county:"Nairobi"}, {name:"William Ruto", county:"National - President"},
  {name:"Kithure Kindiki", county:"National - DP"}, {name:"Raila Odinga", county:"Opposition"}
];

const PLATFORMS = [
  {id:"whatsapp", name:"WhatsApp", icon:"💬", count:892, pct:71, color:"bg-[#25D366]", desc:"Public groups • Swahili/Sheng", live:true, sample:"Barabara ya Siongiroi-Chebole mbaya sana"},
  {id:"facebook", name:"Facebook", icon:"📘", count:234, pct:19, color:"bg-[#1877F2]", desc:"Pages & public groups", live:true, sample:"Bomet county bursary complaint"},
  {id:"x", name:"X (Twitter)", icon:"𝕏", count:89, pct:7, color:"bg-black", desc:"#Bomet #Siongiroi trends", live:true, sample:"#ufisadi Bomet trend"},
  {id:"tiktok", name:"TikTok", icon:"🎵", count:32, pct:3, color:"bg-[#000]", desc:"Citizen videos • comments", live:false, sample:"Roads video 12k views"},
  {id:"radio", name:"Radio / Call-in", icon:"📻", count:18, pct:2, color:"bg-[#FF6B35]", desc:"Kass FM, Chamgei", live:false, sample:"Morning call on water"},
];

export default function Page(){
  const [tab,setTab]=useState("dashboard");
  const [platform,setPlatform]=useState("whatsapp");
  const [search,setSearch]=useState("");
  const [mounted,setMounted]=useState(false);
  useEffect(()=>setMounted(true),[]);
  if(!mounted) return null;
  const filtered = GOVERNORS.filter(g=> (g.name+g.county).toLowerCase().includes(search.toLowerCase()));
  const activePlat = PLATFORMS.find(p=>p.id===platform);

  return (
    <div className="min-h-screen bg-[#F6F7FB] text-[#0A1931]">
      <div className="sticky top-0 z-20 bg-[#0A1931] text-white px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2"><div className="w-8 h-8 bg-[#FF6B35] rounded-lg grid place-items-center font-black">C</div><div><div className="font-bold leading-none text-sm">CivicLens</div><div className="text-[10px] opacity-70">Siongiroi • 47 Counties</div></div></div>
        <div className="text-[10px] bg-white/10 px-2 py-1 rounded-full">50 Leaders • LIVE</div>
      </div>

      <div className="sticky top-[52px] z-10 bg-white border-b px-2 py-2 flex gap-1.5 overflow-x-auto">
        <button onClick={()=>setTab("dashboard")} className={`px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap ${tab==="dashboard"?"bg-[#0A1931] text-white":"bg-gray-100"}`}>Dashboard</button>
        <button onClick={()=>setTab("leaders")} className={`px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap ${tab==="leaders"?"bg-[#0A1931] text-white":"bg-gray-100"}`}>Leaders {GOVERNORS.length}</button>
        <button onClick={()=>setTab("platforms")} className={`px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap ${tab==="platforms"?"bg-[#0A1931] text-white":"bg-gray-100"}`}>Platforms • {PLATFORMS.length}</button>
        <a href="/impact" className="px-3 py-2 rounded-full text-xs font-bold bg-[#FF6B35] text-white whitespace-nowrap ml-auto">Impact</a>
      </div>

      {tab==="dashboard" && (
        <div className="p-3 max-w-[900px] mx-auto">
          <h1 className="text-[28px] font-black leading-[0.95] mt-2">We turn WhatsApp noise <span className="text-[#FF6B35]">into accountability.</span></h1>
          <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1">
            {PLATFORMS.map(p=>(
              <button key={p.id} onClick={()=>{setPlatform(p.id); setTab("platforms")}} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border text-xs whitespace-nowrap"><span>{p.icon}</span><b>{p.name}</b><span className="bg-gray-100 px-1.5 rounded-full">{p.count}</span></button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="bg-white rounded-2xl p-3 border"><div className="text-[10px] text-gray-500">LEADERS</div><div className="text-lg font-black">50</div></div>
            <div className="bg-white rounded-2xl p-3 border"><div className="text-[10px] text-gray-500">MENTIONS</div><div className="text-lg font-black">1,247</div></div>
            <div className="bg-[#0A1931] text-white rounded-2xl p-3"><div className="text-[10px] opacity-60">PLATFORMS</div><div className="text-lg font-black">5</div><div className="text-[9px] text-[#25D366]">WA 71% dominant</div></div>
          </div>
          <div className="bg-white rounded-2xl p-4 border mt-3">
            <b className="text-sm">Trending Issues LIVE</b>
            {[{tag:"#roads", c:234, pct:78},{tag:"#ufisadi", c:189, pct:65},{tag:"#maji", c:156, pct:52},{tag:"#education", c:134, pct:44}].map(t=>(
              <div key={t.tag} className="mt-3"><div className="flex justify-between text-sm"><span className="font-bold">{t.tag}</span><span className="text-xs bg-red-50 px-2 rounded-full">{t.c}</span></div><div className="h-1.5 bg-gray-100 rounded-full mt-1"><div className="h-full bg-red-500 rounded-full" style={{width:`${t.pct}%`}}/></div></div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <a href={`https://wa.me/?text=${encodeURIComponent("CivicLens - 47 Counties https://civiclens-six-psi.vercel.app/")}`} className="bg-[#25D366] text-white text-center py-3 rounded-2xl font-bold text-sm">Share WhatsApp</a>
            <a href="/reports" className="bg-[#0A1931] text-white text-center py-3 rounded-2xl font-bold text-sm">View Reports</a>
          </div>
        </div>
      )}

      {tab==="platforms" && (
        <div className="p-3 max-w-[900px] mx-auto">
          <h2 className="font-black text-xl mt-1">Platforms Intelligence</h2>
          <p className="text-xs text-gray-500">Where Kenyans talk about leaders - 5 sources tracked</p>

          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
            {PLATFORMS.map(p=>(
              <button key={p.id} onClick={()=>setPlatform(p.id)} className={`px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap border flex items-center gap-1.5 ${platform===p.id?"bg-[#0A1931] text-white":"bg-white"}`}><span>{p.icon}</span>{p.name} {p.live && <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>}</button>
            ))}
          </div>

          {activePlat && (
            <div className="bg-white rounded-[20px] border p-4 mt-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2"><div className={`w-10 h-10 ${activePlat.color} text-white rounded-xl grid place-items-center`}>{activePlat.icon}</div><div><div className="font-bold text-sm">{activePlat.name}</div><div className="text-[11px] text-gray-500">{activePlat.desc}</div></div></div>
                <div className="text-right"><div className="text-lg font-black">{activePlat.count}</div><div className="text-[10px] text-gray-500">{activePlat.pct}% of mentions</div></div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full mt-4 overflow-hidden"><div className={`h-full ${activePlat.color}`} style={{width:`${activePlat.pct}%`}} /></div>
              <div className="mt-4 p-3 bg-gray-50 rounded-xl text-sm">Latest: “{activePlat.sample}” <div className="text-[10px] text-gray-500 mt-1">Anonymized • Bomet • 2h ago • Sentiment: Negative</div></div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-[11px]">
                <div className="bg-gray-50 p-2 rounded-xl"><div className="text-gray-500">Languages</div><b>Swahili 45%, Sheng 30%, Kalenjin 15%</b></div>
                <div className="bg-gray-50 p-2 rounded-xl"><div className="text-gray-500">Peak Time</div><b>7-9pm • After barazas</b></div>
                <div className="bg-gray-50 p-2 rounded-xl"><div className="text-gray-500">Trust Score</div><b>{activePlat.live?"High • Verified":"Medium"}</b></div>
              </div>
            </div>
          )}

          <div className="bg-[#0A1931] rounded-[20px] p-4 text-white mt-3">
            <b className="text-sm">Why WhatsApp first?</b><div className="text-xs opacity-80 mt-1">12M Kenyans in public WhatsApp groups. No API. We built scraper for public groups + citizen reporters in Siongiroi. Facebook/X is 10x noisier but 3x less trusted.</div>
            <div className="mt-3 flex gap-2"><a href="/reports" className="text-xs bg-white text-black px-3 py-1.5 rounded-full font-bold">See WA Reports →</a><a href="/impact" className="text-xs bg-[#FF6B35] px-3 py-1.5 rounded-full font-bold">Partner to add USSD *384#</a></div>
          </div>
        </div>
      )}

      {tab==="leaders" && (
        <div className="p-3 max-w-[900px] mx-auto">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search Bomet, Sakaja..." className="w-full p-3 rounded-2xl border bg-white text-sm" />
          <div className="grid md:grid-cols-2 gap-2 mt-3">
            {filtered.map(l=>(
              <div key={l.county+l.name} className={`bg-white p-3 rounded-2xl border flex justify-between ${l.highlight?"ring-2 ring-[#FF6B35]":""}`}><div><div className="font-bold text-sm">{l.name}</div><div className="text-[11px] text-gray-500">{l.county}</div></div><span className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded-full h-fit">LIVE</span></div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
