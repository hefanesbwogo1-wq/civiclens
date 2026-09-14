"use strict";
console.log("CivicLens: settings.js V13 FINAL loaded");
document.addEventListener("DOMContentLoaded", initializeSettings);
let supabaseClient=null;
let currentPlan="pro";

async function initializeSettings(){
  if(!window.SUPABASE_URL ||!window.SUPABASE_ANON_KEY ||!window.supabase){ location.href="/login"; return; }
  supabaseClient=window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  const { data:{ session } } = await supabaseClient.auth.getSession();
  if(!session){ location.href="/login"; return; }
  await loadUser();
  await loadProfileSafe();
  await loadSubscription();
  setupEvents();
}

async function civicLensFetch(url, options={}){
  const { data:{ session } } = await supabaseClient.auth.getSession();
  if(!session){ location.href="/login"; throw new Error("Expired"); }
  const headers=new Headers(options.headers||{});
  headers.set("Authorization",`Bearer ${session.access_token}`);
  headers.set("Content-Type","application/json");
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

async function loadProfileSafe(){
  try{
    const res = await civicLensFetch("/api/profile");
    if(res.ok){
      const json = await res.json();
      const p = json.profile || {};
      fillProfile(p);
      if(json.profile?.subscription_plan) currentPlan=json.profile.subscription_plan;
      return;
    }
    throw new Error("API not ok");
  }catch(e){
    try{
      const { data } = await supabaseClient.auth.getUser();
      if(data?.user){
        const m=data.user.user_metadata||{};
        fillProfile({full_name:m.full_name||"", email:data.user.email||"", organization:m.organization||"", phone:m.phone||""});
      }
    }catch(e2){}
  }
}

function fillProfile(p){
  const set=(id,val)=>{ const el=document.getElementById(id); if(el) el.value=val||""; };
  set("full-name", p.full_name||"");
  set("email", p.email||"");
  set("organization", p.organization||"");
  set("phone", p.phone||"");
  console.log("Profile loaded:", p);
}

async function loadSubscription(){
  try{
    const res=await civicLensFetch("/api/subscription/current");
    const json=await res.json();
    const plan=json.plan||json.subscription_plan||"pro";
    currentPlan=plan;
    renderPlan(plan, json);
  }catch(e){
    console.log("sub fallback", e);
    renderPlan("pro", {plan:"pro"});
  }
}

function renderPlan(plan, data){
  const planEl=document.getElementById("subscription-plan");
  const badge=document.getElementById("subscription-badge");
  const detail=document.getElementById("subscription-detail");
  if(!planEl) return;
  const plans={
    free:{name:"CivicLens Free", badge:"FREE", cls:"badge-free", detail:"3 leaders • 50 mentions/mo • Daily refresh"},
    pro:{name:"CivicLens Pro", badge:"ACTIVE", cls:"badge-pro", detail:"25 leaders • Unlimited mentions • 15min Auto-refresh LIVE • PDF Export"},
    enterprise:{name:"CivicLens Enterprise", badge:"ENTERPRISE", cls:"badge-enterprise", detail:"Unlimited leaders • 5min refresh • API Access • Dedicated Support"}
  };
  const p=plans[plan]||plans.pro;
  planEl.textContent=p.name;
  if(badge){ badge.textContent=p.badge; badge.className="plan-badge "+p.cls; }
  if(detail) detail.textContent=p.detail + (data?.mentions_used? ` • ${data.mentions_used} used` : "");
  // highlight in modal
  document.querySelectorAll(".plan-card").forEach(c=>c.classList.toggle("selected", c.dataset.plan===plan));
}

async function changePlan(newPlan){
  const btn=document.querySelector(`.plan-card[data-plan="${newPlan}"] button`);
  const oldText=btn?btn.textContent:"";
  if(btn){ btn.disabled=true; btn.textContent="Changing..."; }
  try{
    const res=await civicLensFetch("/api/subscription/change",{method:"POST", body: JSON.stringify({plan:newPlan})});
    const json=await res.json();
    if(json.success){
      currentPlan=newPlan;
      renderPlan(newPlan, json);
      document.getElementById("sub-status-msg").textContent=`✓ Changed to ${newPlan.toUpperCase()}`;
      setTimeout(()=>{ document.getElementById("plan-modal").classList.remove("active"); document.getElementById("sub-status-msg").textContent=""; },1500);
      if(btn) btn.textContent="✓ Active";
    }else{ throw new Error(json.message||"Failed"); }
  }catch(err){
    alert("Change plan failed: "+err.message);
    if(btn){ btn.textContent=oldText; btn.disabled=false; }
  }
}
window.changePlan=changePlan;

function setupEvents(){
  document.getElementById("logout-button")?.addEventListener("click", async (e)=>{ e.preventDefault(); if(supabaseClient) await supabaseClient.auth.signOut(); localStorage.clear(); location.href="/login"; });

  document.getElementById("profile-form")?.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const btn=document.getElementById("save-profile-btn"); const old=btn.textContent; btn.disabled=true; btn.textContent="Saving...";
    try{
      const payload={full_name:document.getElementById("full-name")?.value||"", organization:document.getElementById("organization")?.value||"", phone:document.getElementById("phone")?.value||""};
      const res=await civicLensFetch("/api/profile",{method:"PUT", body:JSON.stringify(payload)});
      const json=await res.json();
      if(json.success){
        btn.textContent="✓ Saved!"; const nameEl=document.getElementById("user-name"); if(nameEl && payload.full_name) nameEl.textContent=payload.full_name;
        setTimeout(()=>{btn.textContent=old; btn.disabled=false;},2000);
      }else throw new Error(json.message);
    }catch(err){ alert("Save failed: "+err.message); btn.textContent=old; btn.disabled=false; }
  });

  document.getElementById("save-preferences")?.addEventListener("click", async ()=>{
    const btn=document.getElementById("save-preferences"); const old=btn.textContent; btn.textContent="✓ Saved"; btn.disabled=true;
    localStorage.setItem("civiclens_prefs", JSON.stringify({mention_alerts:document.getElementById("mention-alerts")?.checked, daily_summary:document.getElementById("daily-summary")?.checked, email_notifications:document.getElementById("email-notifications")?.checked}));
    setTimeout(()=>{btn.textContent=old; btn.disabled=false;},1500);
  });

  // Subscription modal
  document.getElementById("change-plan-btn")?.addEventListener("click", ()=>{ document.getElementById("plan-modal").classList.add("active"); });
  document.getElementById("close-modal")?.addEventListener("click", ()=>{ document.getElementById("plan-modal").classList.remove("active"); });
  document.getElementById("plan-modal")?.addEventListener("click", (e)=>{ if(e.target.id==="plan-modal") e.target.classList.remove("active"); });
}