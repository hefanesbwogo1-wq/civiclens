"use strict";
document.addEventListener("DOMContentLoaded", initializeReports);
let supabaseClient=null;
async function initializeReports(){
  if(!window.SUPABASE_URL ||!window.SUPABASE_ANON_KEY ||!window.supabase){ location.href="/login"; return; }
  supabaseClient=window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  const { data:{ session } } = await supabaseClient.auth.getSession();
  if(!session){ location.href="/login"; return; }
  await loadUser(); await loadReports(); setupEvents();
}
async function civicLensFetch(url, options={}){
  const { data:{ session } }=await supabaseClient.auth.getSession();
  if(!session){ location.href="/login"; throw new Error("Your session has expired."); }
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
  }catch(e){ console.error(e); }
}
async function loadReports(){
  try{
    const [sR,lR,pR]=await Promise.all([civicLensFetch("/api/reports/summary"), civicLensFetch("/api/reports/leaders"), civicLensFetch("/api/reports/platforms")]);
    const summary=await sR.json().catch(()=>({})); const leaders=await lR.json().catch(()=>({leaders:[]})); const platforms=await pR.json().catch(()=>({platforms:[]}));
    if(summary.success){ setText("total-mentions",summary.total_mentions); setText("positive-mentions",summary.positive); setText("neutral-mentions",summary.neutral); setText("negative-mentions",summary.negative); }
    renderLeaders(leaders.leaders||[]); renderPlatforms(platforms.platforms||[]);
  }catch(e){ console.error(e); }
}
function renderLeaders(leaders){
  const c=document.getElementById("leader-report"); if(!c) return;
  if(!leaders.length){ c.innerHTML=`<div class="report-empty">No leader mention data available yet.</div>`; return; }
  c.innerHTML=leaders.map(i=>`<div class="report-row"><strong>${escapeHtml(i.leader_name)}</strong><span>${i.mentions}</span></div>`).join("");
}
function renderPlatforms(platforms){
  const c=document.getElementById("platform-report"); if(!c) return;
  if(!platforms.length){ c.innerHTML=`<div class="report-empty">No platform mention data available yet.</div>`; return; }
  c.innerHTML=platforms.map(i=>`<div class="report-row"><strong>${escapeHtml(i.platform)}</strong><span>${i.mentions}</span></div>`).join("");
}
function setupEvents(){
  document.getElementById("refresh-reports")?.addEventListener("click", async function(){
    const b=this; b.disabled=true; b.textContent="↻ Refreshing..."; await loadReports(); b.disabled=false; b.textContent="↻ Refresh";
  });
  document.getElementById("logout-button")?.addEventListener("click", async (e)=>{ e.preventDefault(); if(supabaseClient) await supabaseClient.auth.signOut(); localStorage.clear(); location.href="/login"; });
}
function setText(id,v){ const el=document.getElementById(id); if(el) el.textContent=v??0; }
function escapeHtml(v){ return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
