"use strict";
console.log("CivicLens: leaders-final.js V5 LOADED - NEW FILE!");
document.addEventListener("DOMContentLoaded", async () => {
  const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  console.log("Supabase initialized.");

  let container = document.getElementById("leaders-container");
  console.log("Container found?", !!container, container);
  
  if (!container) {
    console.error("leaders-container STILL not found, creating emergency one");
    container = document.createElement("div");
    container.id = "leaders-container";
    container.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;padding:20px";
    document.body.appendChild(container);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { location.href="/login"; return; }

  console.log("Loading leaders for", user.id);
  let { data, error } = await supabase.from("leaders").select("*").eq("user_id", user.id);
  if (!data || data.length === 0) {
    const r2 = await supabase.from("leaders").select("*").limit(50);
    data = r2.data || [];
  }
  
  console.log("Leaders loaded:", data.length, data);
  
  if (!data || data.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1;background:#fff;padding:40px;border-radius:12px;text-align:center">No leaders yet</div>`;
    return;
  }

  container.innerHTML = data.map(l => `
    <div style="background:#fff;border:1px solid #e7edf5;border-radius:14px;padding:18px">
      <div style="display:flex;gap:12px;align-items:center">
        <div style="width:44px;height:44px;border-radius:50%;background:#eaf2ff;color:#0868dd;display:flex;align-items:center;justify-content:center;font-weight:800">${(l.full_name||"L")[0]}</div>
        <div>
          <div style="font-weight:800;color:#10223b">${l.full_name}</div>
          <div style="font-size:11px;color:#7b8797">${l.position||""} ${l.organization ? "• "+l.organization : ""}</div>
        </div>
      </div>
      <div style="margin-top:12px;display:flex;gap:8px">
        <button onclick="toggleLeader('${l.id}', ${!!l.monitoring_enabled})" style="flex:1;padding:8px;border-radius:8px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:700;cursor:pointer">${l.monitoring_enabled ? "Pause" : "Resume"}</button>
        <button onclick="deleteLeader('${l.id}')" style="padding:8px 12px;border-radius:8px;border:1px solid #fecaca;background:#fef2f2;color:#c00;font-weight:700;cursor:pointer">Delete</button>
      </div>
    </div>
  `).join("");

  window.toggleLeader = async (id, cur) => {
    await supabase.from("leaders").update({ monitoring_enabled: !cur }).eq("id", id);
    location.reload();
  };
  window.deleteLeader = async (id) => {
    if (!confirm("Delete?")) return;
    await supabase.from("leaders").delete().eq("id", id);
    location.reload();
  };

  console.log("CivicLens: leaders-final.js loaded successfully - rendered", data.length);
});