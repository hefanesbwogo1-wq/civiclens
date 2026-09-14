"use strict";
console.log("CivicLens: reports.js V11.1 PRO FIXED loaded");
document.addEventListener("DOMContentLoaded", initializeReports);
let supabaseClient=null;
let cachedData = { summary: null, leaders: [], platforms: [], mentions: [] };

async function initializeReports(){
  if(!window.SUPABASE_URL ||!window.SUPABASE_ANON_KEY ||!window.supabase){ location.href="/login"; return; }
  supabaseClient=window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  const { data:{ session } } = await supabaseClient.auth.getSession();
  if(!session){ location.href="/login"; return; }
  await loadUser();
  await loadReports();
  setupEvents();
}

async function civicLensFetch(url, options={}){
  const { data:{ session } } = await supabaseClient.auth.getSession();
  if(!session){ location.href="/login"; throw new Error("Expired"); }
  const headers=new Headers(options.headers||{});
  headers.set("Authorization",`Bearer ${session.access_token}`);
  return fetch(url,{...options,headers});
}

async function loadUser(){
  try{
    const { data } = await supabaseClient.auth.getUser(); if(!data?.user) return;
    const m=data.user.user_metadata||{}; const name=m.full_name||data.user.email?.split("@")[0]||"CivicLens User";
    const el=(id)=>document.getElementById(id);
    if(el("user-name")) el("user-name").textContent=name;
    if(el("user-email")) el("user-email").textContent=data.user.email||"";
    if(el("user-avatar")) el("user-avatar").textContent=name.trim().charAt(0).toUpperCase();
  }catch(e){}
}

async function loadReports(){
  try{
    const [sR,lR,pR, mR] = await Promise.all([
      civicLensFetch("/api/reports/summary"),
      civicLensFetch("/api/reports/leaders"),
      civicLensFetch("/api/reports/platforms"),
      civicLensFetch("/api/mentions")
    ]);
    const summary = await sR.json().catch(()=>({total:0}));
    const leaders = await lR.json().catch(()=>({leaders:[]}));
    const platforms = await pR.json().catch(()=>({platforms:[]}));
    const mentionsRes = await mR.json().catch(()=>({mentions:[]}));
    
    cachedData.summary = summary;
    cachedData.leaders = leaders.leaders || leaders.data || [];
    cachedData.platforms = platforms.platforms || platforms.data || [];
    cachedData.mentions = mentionsRes.mentions || mentionsRes.data || [];

    const total = summary.total_mentions?? summary.total?? 0;
    const pos = summary.positive??0; const neu = summary.neutral??0; const neg = summary.negative??0;

    setText("total-mentions", total);
    setText("positive-mentions", pos);
    setText("neutral-mentions", neu);
    setText("negative-mentions", neg);
    const rc = document.getElementById("report-count"); if(rc) rc.textContent = total;
    const ls = document.getElementById("leader-summary"); if(ls) ls.textContent = `${cachedData.leaders.length} leaders tracked`;

    // SAFE bars - only if they exist (V11 HTML)
    const posBar = document.getElementById("pos-bar"); if(posBar) posBar.style.width = total? `${(pos/total)*100}%` : "0%";
    const neuBar = document.getElementById("neu-bar"); if(neuBar) neuBar.style.width = total? `${(neu/total)*100}%` : "0%";
    const negBar = document.getElementById("neg-bar"); if(negBar) negBar.style.width = total? `${(neg/total)*100}%` : "0%";

    renderLeaders(cachedData.leaders, total);
    renderPlatforms(cachedData.platforms, total);
    console.log("V11.1 loaded:", summary, "leaders:", cachedData.leaders.length);

  }catch(e){
    console.error("V11.1 load error", e);
  }
}

function renderLeaders(leaders, total){
  const c=document.getElementById("leader-report"); if(!c) return;
  if(!leaders.length){ c.innerHTML=`<div class="report-empty" style="padding:16px;text-align:center;color:#64748b">No leader data. Go to /mentions → Collect Real News</div>`; return; }
  const max = Math.max(...leaders.map(l=> l.mention_count?? l.mentions??0),1);
  c.innerHTML=leaders.map(l=>{
    const name = l.leader_name || l.full_name || l.name || "Unknown";
    const count = l.mention_count?? l.mentions??0;
    const pct = Math.round((count/max)*100);
    const pos = l.positive||0; const neg = l.negative||0;
    const color = neg>pos? "#dc2626" : pos>0? "#16a34a" : "#94a3b8";
    return `<div style="padding:14px 16px;border:1px solid #eef2f7;border-radius:12px;margin-bottom:10px;background:#fff">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><strong style="font-size:13px">${escapeHtml(name)}</strong><div style="font-size:11px;color:#64748b">${escapeHtml(l.position||"")}</div></div>
        <div style="text-align:right"><span style="font-weight:900;font-size:16px">${count}</span><div style="font-size:11px"><span style="color:#16a34a">+${pos}</span> / <span style="color:#dc2626">-${neg}</span></div></div>
      </div>
      <div style="background:#eef2f7;height:8px;border-radius:20px;overflow:hidden;margin-top:8px"><div style="height:100%;border-radius:20px;width:${pct}%;background:${color};transition:width .6s"></div></div>
    </div>`;
  }).join("");
}

function renderPlatforms(platforms, total){
  const c=document.getElementById("platform-report"); if(!c) return;
  if(!platforms.length){ c.innerHTML=`<div class="report-empty" style="padding:16px;text-align:center;color:#64748b">No platform data yet</div>`; return; }
  c.innerHTML=platforms.map(p=>{
    const name = (p.name || p.platform || "News").toUpperCase();
    const count = p.count?? p.mentions?? p.mention_count??0;
    const pct = total? Math.round((count/total)*100) : 0;
    const icon = name.includes("NEWS")? "📰" : name.includes("X")? "𝕏" : "f";
    return `<div style="padding:14px 16px;border:1px solid #eef2f7;border-radius:12px;margin-bottom:10px;background:#fff">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;gap:8px;align-items:center"><div style="width:28px;height:28px;background:#f1f5f9;border-radius:8px;display:flex;align-items:center;justify-content:center">${icon}</div><strong style="font-size:13px">${escapeHtml(name)}</strong></div>
        <span style="font-weight:900">${count}</span>
      </div>
      <div style="background:#eef2f7;height:8px;border-radius:20px;overflow:hidden;margin-top:8px"><div style="height:100%;border-radius:20px;width:${pct}%;background:#1769e0"></div></div>
      <div style="font-size:10px;color:#94a3b8;margin-top:4px">${pct}% of total</div>
    </div>`;
  }).join("");
}

function setupEvents(){
  document.getElementById("refresh-reports")?.addEventListener("click", async function(){
    const b=this; const old=b.textContent; b.disabled=true; b.textContent="↻ Refreshing..."; await loadReports(); b.disabled=false; b.textContent=old;
  });
  document.getElementById("logout-button")?.addEventListener("click", async (e)=>{ e.preventDefault(); if(supabaseClient) await supabaseClient.auth.signOut(); localStorage.clear(); location.href="/login"; });
  document.getElementById("btn-executive")?.addEventListener("click", generateExecutivePDF);
  document.getElementById("btn-sentiment")?.addEventListener("click", generateSentimentReport);
  document.getElementById("btn-comparison")?.addEventListener("click", generateComparison);
  // fallback for old V10 HTML button classes
  document.querySelectorAll(".report-tool").forEach(btn=>{
    if(btn.textContent.includes("Executive") && !btn.id) btn.addEventListener("click", generateExecutivePDF);
    if(btn.textContent.includes("Sentiment") && !btn.id) btn.addEventListener("click", generateSentimentReport);
    if(btn.textContent.includes("Comparison") && !btn.id) btn.addEventListener("click", generateComparison);
  });
}

async function generateExecutivePDF(){
  const jsPDFLib = window.jspdf?.jsPDF || window.jsPDF;
  const jsPDF = window.jspdf?.jsPDF;
  if(!jsPDF && !jsPDFLib){ alert("PDF lib still loading, wait 2 sec and try again"); return; }
  const Doc = jsPDF || jsPDFLib;
  const doc = new Doc();
  const s = cachedData.summary || {}; const leaders = cachedData.leaders || [];
  const total = s.total_mentions||s.total||0;
  doc.setFontSize(18); doc.text("CivicLens - Executive Intelligence Report", 14, 20);
  doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()} | Total Mentions: ${total} | Positive: ${s.positive||0} | Negative: ${s.negative||0}`, 14, 28);
  let y=40; doc.setFontSize(12); doc.text("Mentions by Leader:", 14, y); y+=8; doc.setFontSize(10);
  leaders.forEach(l=>{ const line = `${l.full_name||l.name} - ${l.mention_count||l.mentions||0} mentions (+${l.positive||0}/-${l.negative||0}) - ${l.position||""}`; doc.text(line, 14, y); y+=6; if(y>270){doc.addPage(); y=20;}});
  y+=8; doc.setFontSize(12); doc.text("Recent Mentions:", 14, y); y+=8; doc.setFontSize(8);
  (cachedData.mentions||[]).slice(0,20).forEach(m=>{ const txt = `${(m.leaders?.full_name||"Leader")}: ${(m.title||m.content||"").slice(0,120)} [${m.sentiment||"neutral"}]`; try{doc.text(txt, 14, y, {maxWidth:180});}catch{} y+=8; if(y>270){doc.addPage(); y=20;}});
  doc.save(`CivicLens-Report-${new Date().toISOString().slice(0,10)}.pdf`);
  const st=document.getElementById("export-status"); if(st){st.textContent="✓ PDF downloaded"; setTimeout(()=>st.textContent="",3000);}
}

function generateSentimentReport(){
  const s=cachedData.summary||{}; const total=s.total||s.total_mentions||1;
  const insight = (s.positive||0)>(s.negative||0) ? "Public sentiment is POSITIVE. Favorable coverage." : (s.negative||0)>0 ? "Negative coverage detected. Review /mentions for crisis." : "Coverage is neutral.";
  const html=`<div style="position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center" onclick="this.remove()"><div style="background:#fff;border-radius:16px;padding:24px;max-width:480px;width:90%" onclick="event.stopPropagation()"><h3>Sentiment Intelligence</h3><p style="margin:10px 0;color:#64748b;font-size:13px">${total} real mentions from Google News</p><div style="margin:16px 0"><div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eef2f7"><span>🟢 Positive</span><b>${s.positive||0} (${Math.round((s.positive||0)/total*100)}%)</b></div><div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eef2f7"><span>⚪ Neutral</span><b>${s.neutral||0} (${Math.round((s.neutral||0)/total*100)}%)</b></div><div style="display:flex;justify-content:space-between;padding:8px 0"><span>🔴 Negative</span><b>${s.negative||0} (${Math.round((s.negative||0)/total*100)}%)</b></div></div><p style="font-size:12px;background:#f8fafc;padding:10px;border-radius:8px">${insight}</p><button onclick="this.closest('div').parentElement.remove()" style="margin-top:12px;width:100%;padding:10px;background:#0f1e3a;color:#fff;border:0;border-radius:8px">Close</button></div></div>`;
  document.body.insertAdjacentHTML("beforeend", html);
}

function generateComparison(){
  const leaders=cachedData.leaders||[]; if(leaders.length<2){alert("Add at least 2 leaders to compare. You have "+leaders.length); return;}
  const html=`<div style="position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;overflow:auto;padding:20px" onclick="this.remove()"><div style="background:#fff;border-radius:16px;padding:24px;max-width:700px;width:100%" onclick="event.stopPropagation()"><h3>Leader Comparison - Real Data</h3><table style="width:100%;margin-top:12px;border-collapse:collapse;font-size:13px"><tr style="background:#f8fafc"><th style="text-align:left;padding:8px">Leader</th><th>Men</th><th style="color:#16a34a">Pos</th><th style="color:#dc2626">Neg</th><th>Score</th></tr>${leaders.map(l=>{const score=(l.positive||0)-(l.negative||0); return `<tr style="border-top:1px solid #eef2f7"><td style="padding:8px"><b>${escapeHtml(l.full_name||l.name)}</b><br><small style="color:#64748b">${escapeHtml(l.position||"")}</small></td><td style="padding:8px;text-align:center">${l.mention_count||l.mentions||0}</td><td style="padding:8px;text-align:center;color:#16a34a">${l.positive||0}</td><td style="padding:8px;text-align:center;color:#dc2626">${l.negative||0}</td><td style="padding:8px;text-align:center"><b style="color:${score>=0?'#16a34a':'#dc2626'}">${score>=0?'+':''}${score}</b></td></tr>`}).join("")}</table><button onclick="this.closest('div').parentElement.remove()" style="margin-top:16px;width:100%;padding:10px;background:#0f1e3a;color:#fff;border:0;border-radius:8px">Close</button></div></div>`;
  document.body.insertAdjacentHTML("beforeend", html);
}

function setText(id,v){ const el=document.getElementById(id); if(el) el.textContent=v??0; }
function escapeHtml(v){ return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }