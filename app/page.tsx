"use client";
import { useState, useEffect } from "react";
export default function Page(){
  const [tab,setTab]=useState("dashboard");
  const [mounted,setMounted]=useState(false);
  useEffect(()=>setMounted(true),[]);
  if(!mounted) return null;
  return (
    <div style={{padding:20, fontFamily:"sans-serif", background:"#F2F5FA", minHeight:"100vh"}}>
      <div style={{background:"#0A1931", color:"white", padding:"12px", borderRadius:12, marginBottom:16}}>
        <b>CivicLens</b> - Siongiroi • Dashboard LIVE
      </div>
      <div style={{display:"flex", gap:8, marginBottom:16}}>
        <button onClick={()=>setTab("dashboard")} style={{padding:"8px 12px", background:tab==="dashboard"?"#0A1931":"white", color:tab==="dashboard"?"white":"black", borderRadius:20, border:"1px solid #ddd"}}>Dashboard</button>
        <button onClick={()=>setTab("leaders")} style={{padding:"8px 12px", background:tab==="leaders"?"#0A1931":"white", color:tab==="leaders"?"white":"black", borderRadius:20, border:"1px solid #ddd"}}>Leaders</button>
        <a href="/ngo-pitch" style={{padding:"8px 12px", background:"#FF6B35", color:"white", borderRadius:20, textDecoration:"none"}}>NGO Pitch</a>
      </div>
      {tab==="dashboard" && (
        <div>
          <h1 style={{fontSize:28, fontWeight:800}}>We turn WhatsApp noise into accountability</h1>
          <p>Live AI tracking 60 leaders • 47 Counties • Swahili/Sheng • Bomet pilot</p>
          <div style={{marginTop:16, background:"white", padding:16, borderRadius:12}}>
            <b>Stats LIVE</b>
            <div>60 Leaders | 1.2k Mentions | 47 Counties</div>
          </div>
          <a href="https://wa.me/?text=CivicLens%20LIVE%20https://civiclens-six-psi.vercel.app/" style={{display:"block", marginTop:16, background:"#25D366", color:"white", padding:12, borderRadius:12, textAlign:"center", textDecoration:"none"}}>Share WhatsApp</a>
        </div>
      )}
      {tab==="leaders" && <div><b>60 Leaders - Barchok, Ruto, Sakaja LIVE</b><div style={{marginTop:8}}>William Ruto - President</div><div>Hillary Barchok - Bomet</div></div>}
    </div>
  )
}
