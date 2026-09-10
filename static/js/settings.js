"use strict";
document.addEventListener("DOMContentLoaded", initializeSettings);
let supabaseClient=null, currentUser=null;

async function initializeSettings(){
  if(!window.SUPABASE_URL ||!window.SUPABASE_ANON_KEY ||!window.supabase){ location.href="/login"; return; }
  supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  const { data:{ session } } = await supabaseClient.auth.getSession();
  if(!session){ location.href="/login"; return; }
  await loadUser();
  loadPreferences();
  setupEvents();
}
async function loadUser(){
  try{
    const { data } = await supabaseClient.auth.getUser();
    if(!data?.user) return;
    currentUser=data.user;
    const m=currentUser.user_metadata||{};
    const name=m.full_name||currentUser.email?.split("@")[0]||"CivicLens User";
    const $=id=>document.getElementById(id);
    if($("user-name")) $("user-name").textContent=name;
    if($("user-email")) $("user-email").textContent=currentUser.email||"";
    if($("user-avatar")) $("user-avatar").textContent=name.trim().charAt(0).toUpperCase();
    if($("full-name")) $("full-name").value=m.full_name||"";
    if($("email")) $("email").value=currentUser.email||"";
    if($("organization")) $("organization").value=m.organization||"";
    if($("phone")) $("phone").value=m.phone||"";
    if($("subscription-plan")) $("subscription-plan").textContent=m.subscription_plan||"Basic";
  }catch(e){ console.error(e); }
}
function loadPreferences(){
  try{
    const p=JSON.parse(localStorage.getItem("civiclens_preferences")||"{}");
    const $=id=>document.getElementById(id);
    if(p.mentionAlerts!==undefined && $("mention-alerts")) $("mention-alerts").checked=p.mentionAlerts;
    if(p.dailySummary!==undefined && $("daily-summary")) $("daily-summary").checked=p.dailySummary;
    if(p.emailNotifications!==undefined && $("email-notifications")) $("email-notifications").checked=p.emailNotifications;
  }catch{}
}
function setupEvents(){
  document.getElementById("profile-form")?.addEventListener("submit", saveProfile);
  document.getElementById("save-preferences")?.addEventListener("click", savePreferences);
  document.getElementById("logout-button")?.addEventListener("click", logoutUser);
}
async function saveProfile(e){
  e.preventDefault();
  if(!supabaseClient||!currentUser) return showMessage("Unable to update profile.",true);
  const fullName=document.getElementById("full-name")?.value.trim()||"";
  const organization=document.getElementById("organization")?.value.trim()||"";
  const phone=document.getElementById("phone")?.value.trim()||"";
  const { error } = await supabaseClient.auth.updateUser({ data:{ full_name:fullName, organization, phone } });
  if(error) return showMessage(error.message,true);
  showMessage("Profile updated successfully."); await loadUser();
}
function savePreferences(){
  const p={
    mentionAlerts:document.getElementById("mention-alerts")?.checked||false,
    dailySummary:document.getElementById("daily-summary")?.checked||false,
    emailNotifications:document.getElementById("email-notifications")?.checked||false
  };
  localStorage.setItem("civiclens_preferences",JSON.stringify(p));
  showMessage("Notification preferences saved.");
}
function showMessage(msg,err=false){
  const el=document.getElementById("settings-message"); if(!el) return;
  el.textContent=msg; el.style.display="block";
  el.style.background=err?"#fff0f0":"#eaf8f0"; el.style.color=err?"#b42318":"#187849";
  setTimeout(()=>el.style.display="none",3500);
}
async function logoutUser(){ if(supabaseClient) await supabaseClient.auth.signOut(); localStorage.clear(); location.href="/login"; }