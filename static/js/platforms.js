"use strict";
document.addEventListener("DOMContentLoaded", initializePlatforms);
let supabaseClient=null; const elements={};
async function initializePlatforms(){
  cacheElements();
  if(!window.SUPABASE_URL ||!window.SUPABASE_ANON_KEY ||!window.supabase){ location.href="/login"; return; }
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
    const r=await civicLensFetch("/api/platforms/stats"); const d=await r.json();
    if(!d.success) return;
    if(elements.activePlatforms) elements.activePlatforms.textContent=d.active_platforms||0;
    if(elements.totalMentions) elements.totalMentions.textContent=d.total_mentions||0;
    if(elements.xMentions) elements.xMentions.textContent=d.x_mentions||0;
    if(elements.facebookMentions) elements.facebookMentions.textContent=d.facebook_mentions||0;
  }catch(e){ console.error(e); }
}
async function loadPlatforms(){
  if(!elements.platformList) return;
  elements.platformList.innerHTML=`<div class="platform-loading"><p>Loading platforms...</p></div>`;
  try{
    const r=await civicLensFetch("/api/platforms"); if(!r.ok) throw new Error("fail");
    const result=await r.json(); const list=result.platforms||result||[];
    if(!list.length){ elements.platformList.innerHTML=`<div class="platform-loading"><p>No platforms configured.</p></div>`; return; }
    elements.platformList.innerHTML=list.map(p=>`
      <div class="platform-item">
        <div class="platform-icon">${escapeHtml(p.icon||"🌐")}</div>
        <div class="platform-details"><h4>${escapeHtml(p.name)}</h4><p>${escapeHtml(p.description||"")}</p>
        <div class="platform-meta"><span class="${p.status==="available"?"monitoring-badge":"coming-badge"}">${p.status==="available"?"● MONITORING READY":"COMING SOON"}</span><span>${p.mention_count||0} mentions</span></div></div>
        <button class="platform-action ${p.status!=="available"?"disabled":""}" ${p.status!=="available"?"disabled":""}>${p.status==="available"?"Configure":"Coming Soon"}</button>
      </div>`).join("");
  }catch(e){ elements.platformList.innerHTML=`<div class="platform-loading"><p>Unable to load platforms.</p></div>`; }
}
async function civicLensFetch(url, options={}){
  const { data:{ session } }=await supabaseClient.auth.getSession();
  if(!session){ location.href="/login"; throw new Error("Your session has expired."); }
  const headers=new Headers(options.headers||{});
  headers.set("Authorization",`Bearer ${session.access_token}`);
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
