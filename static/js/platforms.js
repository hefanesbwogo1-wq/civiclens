"use strict";
console.log("CivicLens: platforms.js V8 REAL loaded");
document.addEventListener("DOMContentLoaded", initializePlatforms);
let supabaseClient=null; const elements={};
async function initializePlatforms(){
  cacheElements();
  if(!window.SUPABASE_URL ||!window.SUPABASE_ANON_KEY ||!window.supabase){
    console.error("Missing SUPABASE_URL - check /static/js/config.js");
    location.href="/login"; return;
  }
  supabaseClient=window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  const { data:{ session } } = await supabaseClient.auth.getSession();
  if(!session){ location.href="/login"; return; }
  await loadUser(); await loadStatistics(); await loadPlatforms(); setupEvents();
}
function cacheElements(){
  elements.userName=document.getElementById("user-name");
  elements.userEmail=document.getElementById("user-email");
  elements.userAvatar=document.getElementById("user-avatar");
  elements.platformList=document.getElementById("platform-list");
  elements.activePlatforms=document.getElementById("active-platforms");
  elements.totalMentions=document.getElementById("total-platform-mentions");
  elements.xMentions=document.getElementById("x-mentions");
  elements.facebookMentions=document.getElementById("facebook-mentions");
  elements.refresh=document.getElementById("refresh-platforms");
  elements.logout=document.getElementById("logout-button");
}
async function loadUser(){
  try{
    const { data } = await supabaseClient.auth.getUser();
    if(!data?.user) return;
    const m=data.user.user_metadata||{};
    const name=m.full_name||data.user.email?.split("@")[0]||"CivicLens User";
    if(elements.userName) elements.userName.textContent=name;
    if(elements.userEmail) elements.userEmail.textContent=data.user.email||"";
    if(elements.userAvatar) elements.userAvatar.textContent=name.trim().charAt(0).toUpperCase();
  }catch(e){ console.error(e); }
}
async function loadStatistics(){
  try{
    // Try API first
    const r=await civicLensFetch("/api/platforms/stats");
    const d=await r.json();
    console.log("Platform stats API:", d);
    if(d.success || d.active_platforms!== undefined){
      if(elements.activePlatforms) elements.activePlatforms.textContent=d.active_platforms?? d.active?? 0;
      if(elements.totalMentions) elements.totalMentions.textContent=d.total_mentions?? d.total?? 0;
      if(elements.xMentions) elements.xMentions.textContent=d.x_mentions?? 0;
      if(elements.facebookMentions) elements.facebookMentions.textContent=d.facebook_mentions?? 0;
      return;
    }
  }catch(e){ console.warn("stats API failed, fallback to direct supabase", e); }
  // Fallback direct Supabase
  try{
    const { data: mentions } = await supabaseClient.from("mentions").select("platform").limit(1000);
    const total = mentions?.length || 0;
    const x = mentions?.filter(m=> (m.platform||"").toLowerCase().includes("x") || (m.platform||"").toLowerCase().includes("twitter")).length || 0;
    const fb = mentions?.filter(m=> (m.platform||"").toLowerCase().includes("facebook")).length || 0;
    if(elements.activePlatforms) elements.activePlatforms.textContent = "3";
    if(elements.totalMentions) elements.totalMentions.textContent = total;
    if(elements.xMentions) elements.xMentions.textContent = x;
    if(elements.facebookMentions) elements.facebookMentions.textContent = fb;
  }catch(e){ console.error(e); }
}
async function loadPlatforms(){
  if(!elements.platformList) return;
  elements.platformList.innerHTML=`<div class="platform-loading"><div class="platform-spinner"></div><p>Loading platforms...</p></div>`;
  try{
    const r=await civicLensFetch("/api/platforms");
    const result=await r.json();
    console.log("Platforms API:", result);
    const list=result.platforms||result||[];
    if(!list.length){
      elements.platformList.innerHTML=`<div class="platform-loading"><p>No platforms configured. Seeding defaults...</p></div>`;
      return;
    }
    elements.platformList.innerHTML=list.map(p=>`
      <div class="platform-item" style="display:flex;gap:14px;padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;margin-bottom:10px;align-items:center">
        <div class="platform-icon" style="width:44px;height:44px;border-radius:10px;background:${p.color||"#f1f5f9"};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px">${escapeHtml(p.icon||p.name?.charAt(0)||"🌐")}</div>
        <div class="platform-details" style="flex:1"><h4 style="margin:0;font-size:14px">${escapeHtml(p.name)}</h4><p style="margin:4px 0 6px;color:#64748b;font-size:12px">${escapeHtml(p.description||"Real-time monitoring")}</p>
        <div class="platform-meta" style="display:flex;gap:10px;font-size:11px"><span class="${p.status==="available"?"monitoring-badge":"coming-badge"}" style="padding:3px 8px;border-radius:20px;background:${p.status==="available"?"#dcfce7":"#f1f5f9"};color:${p.status==="available"?"#166534":"#64748b"}">${p.status==="available"?"● MONITORING READY":"● "+(p.status||"ACTIVE").toUpperCase()}</span><span>${p.mention_count||0} mentions collected</span></div></div>
        <button class="platform-action" style="padding:8px 14px;border-radius:8px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:700;font-size:12px">${p.slug==="news"?"Live":"Configure"}</button>
      </div>`).join("");
  }catch(e){
    console.error(e);
    elements.platformList.innerHTML=`<div class="platform-loading"><p>Unable to load platforms. Check console.</p></div>`;
  }
}
async function civicLensFetch(url, options={}){
  const { data:{ session } }=await supabaseClient.auth.getSession();
  if(!session){ location.href="/login"; throw new Error("Your session has expired."); }
  const headers=new Headers(options.headers||{});
  headers.set("Authorization",`Bearer ${session.access_token}`);
  headers.set("Content-Type","application/json");
  return fetch(url,{...options,headers});
}
function setupEvents(){
  elements.refresh?.addEventListener("click", async ()=>{
    if(!elements.refresh) return;
    elements.refresh.disabled=true; elements.refresh.textContent="↻ Refreshing...";
    await loadStatistics(); await loadPlatforms();
    elements.refresh.disabled=false; elements.refresh.textContent="↻ Refresh";
  });
  elements.logout?.addEventListener("click", async (e)=>{ e.preventDefault(); try{ await supabaseClient.auth.signOut(); }catch{} localStorage.clear(); location.href="/login"; });
}
function escapeHtml(v){ return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }