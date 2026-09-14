"use client";
import { useState, useEffect } from "react";

const GOVERNORS = [
  {name:"Abdulswamad Nassir", county:"Mombasa", role:"Governor"},
  {name:"Fatuma Achani", county:"Kwale", role:"Governor"},
  {name:"Gideon Mung'aro", county:"Kilifi", role:"Governor"},
  {name:"Dhadho Godhana", county:"Tana River", role:"Governor"},
  {name:"Issa Timamy", county:"Lamu", role:"Governor"},
  {name:"Andrew Mwadime", county:"Taita Taveta", role:"Governor"},
  {name:"Nathif Jama", county:"Garissa", role:"Governor"},
  {name:"Ahmed Abdullahi", county:"Wajir", role:"Governor"},
  {name:"Mohamed Khalif", county:"Mandera", role:"Governor"},
  {name:"Mohamud Ali", county:"Marsabit", role:"Governor"},
  {name:"Abdi Guyo", county:"Isiolo", role:"Governor"},
  {name:"Mutuma M'Ethingia", county:"Meru", role:"Governor"},
  {name:"Muthomi Njuki", county:"Tharaka Nithi", role:"Governor"},
  {name:"Cecily Mbarire", county:"Embu", role:"Governor"},
  {name:"Julius Malombe", county:"Kitui", role:"Governor"},
  {name:"Wavinya Ndeti", county:"Machakos", role:"Governor"},
  {name:"Mutula Kilonzo Jr", county:"Makueni", role:"Governor"},
  {name:"Moses Badilisha", county:"Nyandarua", role:"Governor"},
  {name:"Mutahi Kahiga", county:"Nyeri", role:"Governor"},
  {name:"Anne Waiguru", county:"Kirinyaga", role:"Governor"},
  {name:"Irungu Kang'ata", county:"Murang'a", role:"Governor"},
  {name:"Kimani Wamatangi", county:"Kiambu", role:"Governor"},
  {name:"Jeremiah Lomorukai", county:"Turkana", role:"Governor"},
  {name:"Simon Kachapin", county:"West Pokot", role:"Governor"},
  {name:"Jonathan Lelelit", county:"Samburu", role:"Governor"},
  {name:"George Natembeya", county:"Trans Nzoia", role:"Governor"},
  {name:"Jonathan Bii", county:"Uasin Gishu", role:"Governor"},
  {name:"Wisley Rotich", county:"Elgeyo Marakwet", role:"Governor"},
  {name:"Stephen Sang", county:"Nandi", role:"Governor"},
  {name:"Benjamin Cheboi", county:"Baringo", role:"Governor"},
  {name:"Joshua Irungu", county:"Laikipia", role:"Governor"},
  {name:"Susan Kihika", county:"Nakuru", role:"Governor"},
  {name:"Patrick Ntutu", county:"Narok", role:"Governor"},
  {name:"Joseph Ole Lenku", county:"Kajiado", role:"Governor"},
  {name:"Erick Mutai", county:"Kericho", role:"Governor"},
  {name:"Hillary Barchok", county:"Bomet", role:"Governor"},
  {name:"Fernandes Barasa", county:"Kakamega", role:"Governor"},
  {name:"Wilber Ottichilo", county:"Vihiga", role:"Governor"},
  {name:"Kenneth Lusaka", county:"Bungoma", role:"Governor"},
  {name:"Paul Otuoma", county:"Busia", role:"Governor"},
  {name:"James Orengo", county:"Siaya", role:"Governor"},
  {name:"Anyang Nyongo", county:"Kisumu", role:"Governor"},
  {name:"Gladys Wanga", county:"Homa Bay", role:"Governor"},
  {name:"Ochilo Ayacko", county:"Migori", role:"Governor"},
  {name:"Simba Arati", county:"Kisii", role:"Governor"},
  {name:"Amos Nyaribo", county:"Nyamira", role:"Governor"},
  {name:"Johnson Sakaja", county:"Nairobi", role:"Governor"},
  {name:"William Ruto", county:"National", role:"President"},
  {name:"Kithure Kindiki", county:"National", role:"DP"},
  {name:"Raila Odinga", county:"National", role:"Opposition"},
];

const TRENDS = [
  {tag:"#roads", count:234},
  {tag:"#ufisadi", count:189},
  {tag:"#maji", count:156},
  {tag:"#education", count:134},
];

export default function Page(){
  const [tab,setTab]=useState("dashboard");
  const [search,setSearch]=useState("");
  const [mounted,setMounted]=useState(false);
  useEffect(()=>setMounted(true),[]);
  if(!mounted) return null;

  const filtered = GOVERNORS.filter(g=> g.name.toLowerCase().includes(search.toLowerCase()) || g.county.toLowerCase().includes(search.toLowerCase()));

  const downloadPDF = () => {
    const content = `CivicLens - 47 Counties Report - ${new Date().toLocaleDateString()}\n\n${GOVERNORS.map(g=>`${g.county} - ${g.name} (${g.role})`).join('\n')}\n\nTrending: #roads 234, #ufisadi 189\nBuilt in Siongiroi\nhttps://civiclens-six-psi.vercel.app/`;
    const blob = new Blob([content], {type:"text/plain"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href=url; a.download=`CivicLens-47-Counties-${Date.now()}.txt`; a.click();
  };

  return (
    <div style={{minHeight:"100vh", background:"#F2F5FA", fontFamily:"sans-serif"}}>
      <div style={{background:"#0A1931", color:"white", padding:"12px 16px", display:"flex", justifyContent:"space-between", position:"sticky", top:0, zIndex:10}}>
        <b>CivicLens - Siongiroi</b>
        <span style={{fontSize:12}}>{GOVERNORS.length} Leaders • 47 Counties LIVE</span>
      </div>

      <div style={{display:"flex", gap:8, padding:12, background:"white", position:"sticky", top:44, zIndex:9, borderBottom:"1px solid #eee"}}>
        <button onClick={()=>setTab("dashboard")} style={{padding:"8px 14px", borderRadius:20, border:"none", background:tab==="dashboard"?"#0A1931":"#eee", color:tab==="dashboard"?"white":"black"}}>Dashboard</button>
        <button onClick={()=>setTab("leaders")} style={{padding:"8px 14px", borderRadius:20, border:"none", background:tab==="leaders"?"#0A1931":"#eee", color:tab==="leaders"?"white":"black"}}>Leaders {filtered.length}</button>
        <a href="/ngo-pitch" style={{padding:"8px 14px", borderRadius:20, background:"#FF6B35", color:"white", textDecoration:"none"}}>Partner</a>
      </div>

      {tab==="dashboard" && (
        <div style={{padding:16}}>
          <h1 style={{fontSize:30, fontWeight:900, lineHeight:1.1}}>We turn WhatsApp noise into accountability</h1>
          <p style={{color:"#555", marginTop:6}}>Live AI tracking {GOVERNORS.length} leaders • 47 Counties • Swahili/Sheng • Bomet pilot</p>
          
          <div style={{background:"white", padding:16, borderRadius:12, marginTop:16}}>
            <b>Stats LIVE</b>
            <div style={{display:"flex", gap:12, marginTop:8, flexWrap:"wrap"}}>
              <span style={{background:"#0A1931", color:"white", padding:"6px 10px", borderRadius:20, fontSize:12}}>{GOVERNORS.length} Leaders</span>
              <span style={{background:"#eee", padding:"6px 10px", borderRadius:20, fontSize:12}}>1.2k Mentions</span>
              <span style={{background:"#eee", padding:"6px 10px", borderRadius:20, fontSize:12}}>47 Counties</span>
            </div>
            <div style={{marginTop:16}}>
              {TRENDS.map(t=><div key={t.tag} style={{display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #f0f0f0"}}><b>{t.tag}</b><span style={{background:"#ffe5e5", padding:"2px 10px", borderRadius:12, fontSize:12}}>{t.count}</span></div>)}
            </div>
          </div>

          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:16}}>
            <a href={`https://wa.me/?text=${encodeURIComponent(`CivicLens LIVE - ${GOVERNORS.length} leaders tracked - 47 Counties https://civiclens-six-psi.vercel.app/`)}`} style={{background:"#25D366", color:"white", padding:14, borderRadius:12, textAlign:"center", textDecoration:"none", fontWeight:700}}>Share WhatsApp</a>
            <button onClick={downloadPDF} style={{background:"#0A1931", color:"white", padding:14, borderRadius:12, fontWeight:700, border:"none"}}>Download Report PDF</button>
          </div>
        </div>
      )}

      {tab==="leaders" && (
        <div style={{padding:12}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search county or leader (Bomet, Sakaja...)" style={{width:"100%", padding:"12px", borderRadius:12, border:"1px solid #ddd", marginBottom:12}} />
          <div style={{display:"grid", gap:8}}>
            {filtered.map(l=>(
              <div key={l.county+l.name} style={{background:"white", padding:12, borderRadius:12, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                <div><b style={{fontSize:14}}>{l.name}</b><div style={{fontSize:11, color:"#666"}}>{l.role} • {l.county}</div></div>
                <div style={{display:"flex", gap:6}}>
                  <span style={{fontSize:10, background:"#e5ffe5", padding:"4px 8px", borderRadius:20}}>LIVE</span>
                  <a href={`https://wa.me/?text=${encodeURIComponent(`${l.name} (${l.county}) accountability - CivicLens https://civiclens-six-psi.vercel.app/`)}`} style={{fontSize:10, background:"#eee", padding:"4px 8px", borderRadius:20, textDecoration:"none"}}>WA</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}




