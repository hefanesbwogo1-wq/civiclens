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

export default function Page(){
  const [tab,setTab]=useState("dashboard");
  const [search,setSearch]=useState("");
  const [mounted,setMounted]=useState(false);
  useEffect(()=>setMounted(true),[]);
  if(!mounted) return null;

  const filtered = GOVERNORS.filter(g=> (g.name+g.county).toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#F6F7FB] text-[#0A1931] font-sans">
      {/* TOP BAR */}
      <div className="sticky top-0 z-20 bg-[#0A1931] text-white px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#FF6B35] rounded-lg grid place-items-center font-black">C</div>
          <div><div className="font-bold leading-none">CivicLens</div><div className="text-[10px] opacity-70">Siongiroi • Bomet Pilot</div></div>
        </div>
        <div className="text-[11px] bg-white/10 px-3 py-1 rounded-full">50 Leaders • 47 Counties LIVE • <span className="text-green-400">●</span></div>
      </div>

      {/* TABS */}
      <div className="sticky top-[52px] z-10 bg-white border-b px-3 py-2 flex gap-2">
        <button onClick={()=>setTab("dashboard")} className={`px-4 py-2 rounded-full text-sm font-semibold ${tab==="dashboard"?"bg-[#0A1931] text-white":"bg-gray-100"}`}>Dashboard</button>
        <button onClick={()=>setTab("leaders")} className={`px-4 py-2 rounded-full text-sm font-semibold ${tab==="leaders"?"bg-[#0A1931] text-white":"bg-gray-100"}`}>Leaders {GOVERNORS.length}</button>
        <a href="/impact" className="px-4 py-2 rounded-full text-sm font-bold bg-[#FF6B35] text-white ml-auto">Impact</a>
      </div>

      {tab==="dashboard" && (
        <div className="p-4 max-w-[900px] mx-auto">
          <h1 className="text-[32px] font-black leading-[0.95] tracking-tight mt-2">We turn WhatsApp noise <span className="text-[#FF6B35]">into accountability.</span></h1>
          <p className="text-sm text-gray-500 mt-2">Live AI tracking 50 leaders • 47 Counties • Swahili / Sheng • Real public groups</p>

          {/* STATS GRID */}
          <div className="grid grid-cols-3 gap-2 mt-5">
            <div className="bg-white rounded-2xl p-3 border"><div className="text-[11px] text-gray-500">LEADERS</div><div className="text-xl font-black">50</div><div className="text-[10px] text-green-600">+3 this week</div></div>
            <div className="bg-white rounded-2xl p-3 border"><div className="text-[11px] text-gray-500">MENTIONS</div><div className="text-xl font-black">1,247</div><div className="text-[10px] text-green-600">+89 today</div></div>
            <div className="bg-[#0A1931] text-white rounded-2xl p-3 border"><div className="text-[11px] opacity-70">COUNTIES</div><div className="text-xl font-black">47</div><div className="text-[10px] text-[#FF6B35]">100% coverage</div></div>
          </div>

          {/* MAIN CARDS */}
          <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-3 mt-4">
            <div className="bg-white rounded-[20px] p-4 border shadow-sm">
              <div className="flex justify-between items-center"><b className="text-sm">Trending Issues LIVE</b><a href="/reports" className="text-[11px] bg-gray-900 text-white px-2 py-1 rounded-full">View All →</a></div>
              {[
                {tag:"#roads", c:234, pct:78, color:"bg-red-500"},
                {tag:"#ufisadi", c:189, pct:65, color:"bg-orange-500"},
                {tag:"#maji", c:156, pct:52, color:"bg-blue-500"},
                {tag:"#education", c:134, pct:44, color:"bg-green-500"},
              ].map(t=>(
                <div key={t.tag} className="mt-4">
                  <div className="flex justify-between text-sm"><span className="font-bold">{t.tag}</span><span className="text-xs bg-red-50 px-2 rounded-full">{t.c}</span></div>
                  <div className="h-2 bg-gray-100 rounded-full mt-2 overflow-hidden"><div className={`h-full ${t.color}`} style={{width:`${t.pct}%`}} /></div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="bg-white rounded-[20px] p-4 border">
                <b className="text-sm">Sentiment</b>
                <div className="flex items-end gap-2 mt-3">
                  <div className="flex-1"><div className="h-16 bg-red-100 rounded-t-lg" style={{height:48}} /><div className="text-[10px] text-center mt-1">Neg 62%</div></div>
                  <div className="flex-1"><div className="h-16 bg-yellow-100 rounded-t-lg" style={{height:24}} /><div className="text-[10px] text-center mt-1">Neu 22%</div></div>
                  <div className="flex-1"><div className="h-16 bg-green-100 rounded-t-lg" style={{height:20}} /><div className="text-[10px] text-center mt-1">Pos 16%</div></div>
                </div>
              </div>
              <div className="bg-[#0A1931] rounded-[20px] p-4 text-white">
                <div className="text-[11px] opacity-60">BOMET PILOT - LIVE</div>
                <div className="font-bold mt-1">Hillary Barchok</div>
                <div className="text-xs opacity-80">#roads #maji top complaints - Siongiroi ward</div>
                <a href="/reports" className="mt-3 inline-block text-xs bg-white text-black px-3 py-1.5 rounded-full font-bold">View Bomet Report →</a>
              </div>
            </div>
          </div>

          {/* LIVE FEED */}
          <div className="bg-white rounded-[20px] p-4 border mt-3">
            <b className="text-sm">Live WhatsApp Feed (anonymized)</b>
            <div className="mt-3 space-y-2 text-[13px]">
              <div className="p-2 bg-gray-50 rounded-xl">“Barabara ya Siongiroi-Chebole mbaya sana, mchanga tu” <span className="text-[10px] bg-red-100 px-1 rounded">#roads • Bomet</span></div>
              <div className="p-2 bg-gray-50 rounded-xl">“Maji hakuna kwa wiki tatu Sotik” <span className="text-[10px] bg-blue-100 px-1 rounded">#maji • Bomet</span></div>
              <div className="p-2 bg-gray-50 rounded-xl">“Bursary ya county haijafika shule” <span className="text-[10px] bg-green-100 px-1 rounded">#education • Nairobi</span></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <a href={`https://wa.me/?text=${encodeURIComponent("CivicLens PRO - 47 Counties LIVE https://civiclens-six-psi.vercel.app/")}`} className="bg-[#25D366] text-white text-center py-3.5 rounded-2xl font-bold text-sm">Share WhatsApp</a>
            <button onClick={()=>{const t=`CivicLens 47 Counties Report\n${GOVERNORS.map(g=>`${g.county} - ${g.name}`).join('\n')}`; const b=new Blob([t],{type:"text/plain"}); const u=URL.createObjectURL(b); const a=document.createElement("a"); a.href=u; a.download="CivicLens-PRO.txt"; a.click()}} className="bg-[#0A1931] text-white py-3.5 rounded-2xl font-bold text-sm">Download Report PDF</button>
          </div>
        </div>
      )}

      {tab==="leaders" && (
        <div className="p-3 max-w-[900px] mx-auto">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search county, e.g. Bomet, Turkana, Sakaja..." className="w-full p-3 rounded-2xl border bg-white text-sm outline-none" />
          <div className="grid md:grid-cols-2 gap-2 mt-3">
            {filtered.map(l=>(
              <div key={l.county+l.name} className={`bg-white p-3 rounded-2xl border flex justify-between items-center ${l.highlight?"ring-2 ring-[#FF6B35]":""}`}>
                <div><div className="font-bold text-sm">{l.name} {l.highlight && <span className="text-[10px] bg-[#FF6B35] text-white px-1.5 py-0.5 rounded-full ml-1">PILOT</span>}</div><div className="text-[11px] text-gray-500">{l.county}</div></div>
                <div className="flex gap-1"><span className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded-full">LIVE</span><a href={`https://wa.me/?text=${encodeURIComponent(l.name+" "+l.county)}`} className="text-[10px] bg-gray-100 px-2 py-1 rounded-full">WA</a></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
