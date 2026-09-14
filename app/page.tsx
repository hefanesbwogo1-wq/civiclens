"use client";
import { useState, useEffect } from "react";

const LEADERS = [
  {name:"William Ruto", role:"President", county:"National"},
  {name:"Hillary Barchok", role:"Governor", county:"Bomet"},
  {name:"Gladys Wanga", role:"Governor", county:"Homa Bay"},
  {name:"Johnson Sakaja", role:"Governor", county:"Nairobi"},
  {name:"George Natembeya", role:"Governor", county:"Trans Nzoia"},
  {name:"Anyang Nyongo", role:"Governor", county:"Kisumu"},
];

const TRENDS = [
  {tag:"#roads", count:234, sentiment:"negative"},
  {tag:"#ufisadi", count:189, sentiment:"negative"},
  {tag:"#maji", count:156, sentiment:"neutral"},
  {tag:"#education", count:134, sentiment:"positive"},
];

export default function Page(){
  const [tab,setTab]=useState("dashboard");
  const [mounted,setMounted]=useState(false);
  useEffect(()=>setMounted(true),[]);
  if(!mounted) return null;

  return (
    <div style={{minHeight:"100vh", background:"#F2F5FA", fontFamily:"sans-serif"}}>
      <div style={{background:"#0A1931", color:"white", padding:"12px 20px", display:"flex", justifyContent:"space-between", borderRadius: "0 0 12px 12px"}}>
        <b>CivicLens - Siongiroi • Dashboard LIVE</b>
        <span style={{fontSize:12, opacity:0.8}}>47 Counties</span>
      </div>

      <div style={{display:"flex", gap:8, padding:12}}>
        {[
          {id:"dashboard", label:"Dashboard"},
          {id:"leaders", label:"Leaders"},
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 16px", borderRadius:20, border:"1px solid #ddd", background:tab===t.id?"#0A1931":"white", color:tab===t.id?"white":"black"}}>{t.label}</button>
        ))}
        <a href="/ngo-pitch" style={{padding:"8px 16px", borderRadius:20, background:"#FF6B35", color:"white", textDecoration:"none"}}>NGO Pitch</a>
      </div>

      {tab==="dashboard" && (
        <div style={{padding:"0 16px 20px"}}>
          <h1 style={{fontSize:32, fontWeight:900, lineHeight:1.1, margin:"12px 0"}}>We turn WhatsApp noise into accountability</h1>
          <p style={{color:"#555"}}>Live AI tracking 60 leaders • 47 Counties • Swahili/Sheng • Bomet pilot</p>
          
          <div style={{background:"white", padding:16, borderRadius:12, marginTop:16, boxShadow:"0 1px 3px rgba(0,0,0,0.1)"}}>
            <b>Stats LIVE</b>
            <div style={{marginTop:8, display:"flex", gap:16}}>
              <span>60 Leaders</span><span>•</span><span>1.2k Mentions</span><span>•</span><span>47 Counties</span>
            </div>
            <div style={{marginTop:12}}>
              {TRENDS.map(tr=>(
                <div key={tr.tag} style={{display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #f0f0f0"}}>
                  <span style={{fontWeight:600}}>{tr.tag}</span>
                  <span style={{background:tr.sentiment==="negative"?"#ffe5e5":"#e5ffe5", padding:"2px 8px", borderRadius:10, fontSize:12}}>{tr.count}</span>
                </div>
              ))}
            </div>
          </div>

          <a href={`https://wa.me/?text=${encodeURIComponent("CivicLens LIVE - 47 Counties https://civiclens-six-psi.vercel.app/")}`} style={{display:"block", marginTop:16, background:"#25D366", color:"white", textAlign:"center", padding:14, borderRadius:12, textDecoration:"none", fontWeight:700}}>Share WhatsApp</a>
        </div>
      )}

      {tab==="leaders" && (
        <div style={{padding:"0 16px"}}>
          <div style={{display:"grid", gap:10}}>
            {LEADERS.map(l=>(
              <div key={l.name} style={{background:"white", padding:14, borderRadius:12, display:"flex", justifyContent:"space-between"}}>
                <div><b>{l.name}</b><div style={{fontSize:12, color:"#666"}}>{l.role} • {l.county}</div></div>
                <span style={{fontSize:12, background:"#eee", padding:"6px 10px", borderRadius:20}}>LIVE</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
