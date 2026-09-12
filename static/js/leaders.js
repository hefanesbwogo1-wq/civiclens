"use strict";
console.log("CivicLens: leaders.js file loaded V5");
document.addEventListener("DOMContentLoaded", async () => {
  console.log("CivicLens: leaders.js initializing...");
  const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  console.log("CivicLens: Supabase initialized.");
  const container = document.getElementById("leaders-container");
  console.log("CivicLens: container found?", !!container);
  if (!container) { console.error("leaders-container not found - check HTML"); return; }
  console.log("CivicLens: Loading leaders...");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { location.href="/login"; return; }
  async function loadLeaders() {
    container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:#64748b">Loading...</div>`;
    let { data } = await supabase.from("leaders").select("*").eq("user_id", user.id).order("created_at", {ascending:false});
    if (!data || data.length===0) {
      const r2 = await supabase.from("leaders").select("*").limit(50).order("created_at", {ascending:false});
      data = r2.data || [];
    }
    console.log("CivicLens: Leaders loaded:", data.length);
    if (data.length===0) {
      container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;background:#fff;border-radius:12px">No leaders</div>`;
      return;
    }
    function renderLeaders(list) {
      const c = document.getElementById("leaders-container");
      if (!c) { console.error("CivicLens: leaders-container not found in render"); return; }
      c.innerHTML = list.map(l => `<div style="background:#fff;border:1px solid #e7edf5;border-radius:14px;padding:18px"><div style="display:flex;gap:12px;align-items:center"><div style="width:44px;height:44px;border-radius:50%;background:#eaf2ff;color:#0868dd;display:flex;align-items:center;justify-content:center;font-weight:800">${(l.full_name||"L")[0]}</div><div><div style="font-weight:800;color:#10223b">${l.full_name}</div><div style="font-size:11px;color:#7b8797">${l.organization||""}</div></div></div><div style="display:flex;gap:8px;margin-top:12px"><button onclick="toggleLeader('${l.id}', ${!!l.monitoring_enabled})" style="flex:1;padding:8px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;font-weight:700;font-size:11px;cursor:pointer">${l.monitoring_enabled?"Pause":"Resume"}</button><button onclick="deleteLeader('${l.id}')" style="padding:8px 12px;border:1px solid #fecaca;background:#fef2f2;color:#b42318;border-radius:8px;font-weight:700;font-size:11px;cursor:pointer">Delete</button></div></div>`).join("");
    }
    window.toggleLeader = async (id, cur) => { await supabase.from("leaders").update({monitoring_enabled:!cur}).eq("id", id); loadLeaders(); };
    window.deleteLeader = async (id) => { if(!confirm("Delete?")) return; await supabase.from("leaders").delete().eq("id", id); loadLeaders(); };
    renderLeaders(data);
    console.log("CivicLens: leaders.js loaded successfully.");
  }
  await loadLeaders();
  document.getElementById("refresh-leaders")?.addEventListener("click", loadLeaders);
  document.getElementById("add-leader-btn")?.addEventListener("click", ()=> document.getElementById("add-leader-modal").style.display="flex");
  document.getElementById("close-modal")?.addEventListener("click", ()=> document.getElementById("add-leader-modal").style.display="none");
  document.getElementById("add-leader-form")?.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const name = document.getElementById("leader-name").value.trim();
    if(!name) return;
    await supabase.from("leaders").insert({ user_id: user.id, full_name: name, public_name: name, position: document.getElementById("leader-position").value, organization: document.getElementById("leader-org").value, monitoring_enabled:true });
    document.getElementById("add-leader-modal").style.display="none"; loadLeaders();
  });
});