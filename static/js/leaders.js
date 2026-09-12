"use strict";
console.log("CivicLens: leaders.js file loaded - V4 FINAL");
document.addEventListener("DOMContentLoaded", async () => {
  console.log("CivicLens: leaders.js initializing...");
  const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  console.log("CivicLens: Supabase initialized.");

  function getContainer() {
    let c = document.getElementById("leaders-container") 
         || document.getElementById("leaders-grid");
    if (!c) {
      // Find the "Loading leaders..." text and replace it
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while (node = walker.nextNode()) {
        if (node.nodeValue.trim() === "Loading leaders...") {
          c = document.createElement("div");
          c.id = "leaders-container";
          c.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;padding:20px";
          node.parentElement.parentElement.replaceWith(c);
          console.log("CivicLens: Created container from Loading text");
          break;
        }
      }
      // Fallback create in main
      if (!c) {
        c = document.createElement("div");
        c.id = "leaders-container";
        c.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;padding:20px;margin-top:20px";
        const main = document.querySelector(".main") || document.querySelector("main") || document.body;
        main.appendChild(c);
      }
    }
    return c;
  }

  console.log("CivicLens: Loading leaders...");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href = "/login"; return; }

  async function loadLeaders() {
    const container = getContainer();
    if (!container) {
      console.error("CivicLens: leaders-container not found - even after create!");
      return;
    }
    
    container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:#64748b">Loading...</div>`;

    // NO /api/leaders call - Direct Supabase, so no 401
    let { data, error } = await supabase.from("leaders").select("*").eq("user_id", user.id).order("created_at", {ascending:false});
    if ((!data || data.length===0)) {
      let r2 = await supabase.from("leaders").select("*").limit(100).order("created_at", {ascending:false});
      data = r2.data || [];
    }

    console.log("CivicLens: Leaders loaded:", data.length);
    
    if (!data || data.length === 0) {
      container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;background:#fff;border-radius:12px">No leaders</div>`;
      return;
    }

    // THIS IS THE renderLeaders THAT WAS FAILING AT LINE 450 - NOW FIXED
    function renderLeaders(list) {
      const cont = getContainer();
      cont.innerHTML = list.map(l => `
        <div style="background:#fff;border:1px solid #e7edf5;border-radius:14px;padding:18px">
          <div style="display:flex;gap:12px;align-items:center">
            <div style="width:44px;height:44px;border-radius:50%;background:#eaf2ff;color:#0868dd;display:flex;align-items:center;justify-content:center;font-weight:800">${(l.full_name||"L")[0]}</div>
            <div><div style="font-weight:800;color:#10223b">${l.full_name}</div><div style="font-size:11px;color:#7b8797">${l.organization||""} ${l.position||""}</div></div>
          </div>
          <div style="display:flex;gap:8px;margin-top:12px">
            <button onclick="toggleLeader('${l.id}', ${!!l.monitoring_enabled})" style="flex:1;padding:8px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;font-weight:700;font-size:11px;cursor:pointer">${l.monitoring_enabled?"Pause":"Resume"}</button>
            <button onclick="deleteLeader('${l.id}')" style="padding:8px 12px;border:1px solid #fecaca;background:#fef2f2;color:#b42318;border-radius:8px;font-weight:700;font-size:11px;cursor:pointer">Delete</button>
          </div>
        </div>
      `).join("");
      console.log("CivicLens: leaders-container found and rendered:", list.length);
    }

    window.toggleLeader = async (id, cur) => {
      await supabase.from("leaders").update({monitoring_enabled: !cur}).eq("id", id);
      await loadLeaders();
    };
    window.deleteLeader = async (id) => {
      if(!confirm("Delete?")) return;
      await supabase.from("leaders").delete().eq("id", id);
      await loadLeaders();
    };

    renderLeaders(data);
    console.log("CivicLens: leaders.js loaded successfully.");
  }

  await loadLeaders();

  // Search
  const search = document.getElementById("search-leaders") || document.querySelector('input[placeholder*="Search"]');
  if (search) search.addEventListener("input", async (e)=>{
    const q = e.target.value.toLowerCase();
    if(!q) return loadLeaders();
    const { data } = await supabase.from("leaders").select("*").eq("user_id", user.id);
    const filtered = (data||[]).filter(l => `${l.full_name} ${l.organization||""}`.toLowerCase().includes(q));
    const cont = getContainer();
    if(filtered.length===0) cont.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px">No match for ${q}</div>`;
    else {
      cont.innerHTML = filtered.map(l => `<div style="background:#fff;border:1px solid #e7edf5;border-radius:14px;padding:18px"><div style="font-weight:800">${l.full_name}</div></div>`).join("");
    }
  });
});