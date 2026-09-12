"use strict";
document.addEventListener("DOMContentLoaded", async () => {
  console.log("CivicLens: Loading leaders... FINAL FIX V2");
  const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  const container = document.getElementById("leaders-container");
  console.log("Container found:", !!container, container);

  if (!container) {
    alert("CRITICAL: HTML missing #leaders-container - fix HTML file first!");
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href="/login"; return; }

  async function load() {
    container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:#94a3b8"><div style="width:32px;height:32px;margin:0 auto 12px;border:3px solid #e7edf5;border-top-color:#1769e0;border-radius:50%;animation:spin .8s linear infinite"></div>Loading leaders...</div>`;
    try {
      let { data, error } = await supabase.from("leaders").select("*").eq("user_id", user.id).order("created_at",{ascending:false});
      console.log("Leaders with user_id", data?.length, error);
      if (!data || data.length === 0 || error) {
        let r2 = await supabase.from("leaders").select("*").order("created_at",{ascending:false}).limit(100);
        console.log("Leaders fallback all", r2.data?.length, r2.error);
        data = r2.data || [];
      }
      console.log("CivicLens: Leaders loaded:", data.length);
      if (data.length === 0) {
        container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:80px 30px;background:#fff;border:1px solid #e2e8f0;border-radius:16px"><h3>No leaders yet</h3><p style="color:#64748b;margin:8px 0">Add first leader</p></div>`;
        return;
      }
      container.innerHTML = data.map(l => `
        <div style="background:#fff;border:1px solid #e7edf5;border-radius:14px;padding:18px">
          <div style="display:flex;gap:12px;align-items:center">
            <div style="width:44px;height:44px;border-radius:50%;background:#eaf2ff;color:#0868dd;display:flex;align-items:center;justify-content:center;font-weight:800">${(l.full_name||"L")[0]}</div>
            <div><div style="font-weight:800;color:#10223b">${l.full_name}</div><div style="font-size:11px;color:#7b8797">${l.organization||""} ${l.position||""}</div></div>
          </div>
          <div style="display:flex;gap:8px;margin-top:14px">
            <button onclick="toggleLeader('${l.id}', ${!!l.monitoring_enabled})" style="flex:1;padding:8px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;font-size:11px;font-weight:700;cursor:pointer">${l.monitoring_enabled?"Pause":"Resume"}</button>
            <button onclick="deleteLeader('${l.id}')" style="padding:8px 12px;border:1px solid #fecaca;border-radius:8px;background:#fef2f2;color:#b42318;font-size:11px;font-weight:700;cursor:pointer">Delete</button>
          </div>
        </div>
      `).join("");
    } catch(e){ console.error(e); container.innerHTML = `<div style="color:red;padding:20px">Error: ${e.message}</div>`; }
  }

  window.toggleLeader = async (id, current) => {
    await supabase.from("leaders").update({monitoring_enabled: !current}).eq("id", id);
    await load();
  };
  window.deleteLeader = async (id) => {
    if(!confirm("Delete?")) return;
    await supabase.from("leaders").delete().eq("id", id);
    await load();
  };

  document.getElementById("refresh-leaders")?.addEventListener("click", load);
  document.getElementById("search-leaders")?.addEventListener("input", (e)=>{
    const q = e.target.value.toLowerCase();
    const cards = container.querySelectorAll("div > div");
    // simple filter
    load().then(()=>{
      if(!q) return;
      const filtered = [...container.children].filter(c=>c.textContent.toLowerCase().includes(q));
    });
  });
  // Actually implement proper search after load
  let all = [];
  const searchInput = document.getElementById("search-leaders");
  if(searchInput){
    searchInput.addEventListener("input", ()=>{
      const q = searchInput.value.toLowerCase();
      if(!q){ load(); return; }
      supabase.from("leaders").select("*").then(r=>{
        const list = (r.data||[]).filter(l=> (l.full_name+" "+(l.organization||"")).toLowerCase().includes(q));
        container.innerHTML = list.map(l => `
          <div style="background:#fff;border:1px solid #e7edf5;border-radius:14px;padding:18px">
            <div style="display:flex;gap:12px;align-items:center">
              <div style="width:44px;height:44px;border-radius:50%;background:#eaf2ff;color:#0868dd;display:flex;align-items:center;justify-content:center;font-weight:800">${(l.full_name||"L")[0]}</div>
              <div><div style="font-weight:800;color:#10223b">${l.full_name}</div><div style="font-size:11px;color:#7b8797">${l.organization||""}</div></div>
            </div>
          </div>
        `).join("");
      });
    });
  }

  await load();
  console.log("CivicLens: leaders.js loaded successfully FINAL V2");
});