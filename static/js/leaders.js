"use strict";
document.addEventListener("DOMContentLoaded", async () => {
  const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  
  // Find container with ANY possible ID (fixes your bug)
  const container = document.getElementById("leaders-container") 
                 || document.getElementById("leaders-grid")
                 || document.getElementById("leaders-list")
                 || document.querySelector(".leaders-grid")
                 || document.querySelector(".leaders-container");
  
  const searchEl = document.getElementById("search-leaders") || document.querySelector('input[placeholder*="Search leaders"]');
  const addBtn = document.getElementById("add-leader-btn") || document.querySelector('button:contains("Add Leader")') || document.querySelector(".btn-primary");
  const refreshBtn = document.getElementById("refresh-leaders");

  console.log("CivicLens: Starting leaders loader, container:", !!container);
  if (!container) {
    console.error("CivicLens: leaders-container not found. Check HTML IDs");
    // Try to create it
    const main = document.querySelector("main") || document.querySelector(".content");
    if (main) {
      const div = document.createElement("div");
      div.id = "leaders-container";
      div.className = "leaders-grid";
      main.appendChild(div);
    }
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href="/login"; return; }

  let allLeaders = [];

  async function loadLeaders() {
    // Show loading only if container exists
    const target = document.getElementById("leaders-container") || document.getElementById("leaders-grid") || container;
    if (target) target.innerHTML = `<div class="mentions-loading"><div class="loading-spinner"></div><p>Loading leaders...</p></div>`;

    let leaders = [];
    try {
      // Try with user_id
      let r1 = await supabase.from("leaders").select("*").eq("user_id", user.id).order("created_at",{ascending:false});
      console.log("Leaders with user_id:", r1.data?.length, r1.error);
      if (r1.data && r1.data.length > 0) leaders = r1.data;
      
      // Fallback: all leaders
      if (leaders.length === 0) {
        let r2 = await supabase.from("leaders").select("*").order("created_at",{ascending:false}).limit(50);
        console.log("Leaders fallback all:", r2.data?.length, r2.error);
        if (r2.data) leaders = r2.data;
      }
    } catch(e) { console.error(e); }

    allLeaders = leaders || [];
    console.log("CivicLens: Leaders loaded:", allLeaders.length);
    render(allLeaders);
    return allLeaders;
  }

  function render(list) {
    const target = document.getElementById("leaders-container") || document.getElementById("leaders-grid") || document.getElementById("leaders-list") || container;
    if (!target) { console.error("CivicLens: leaders-container not found. - cannot render"); return; }
    
    const q = (searchEl?.value || "").toLowerCase();
    let filtered = list.filter(l => !q || `${l.full_name} ${l.organization||""} ${l.position||""}`.toLowerCase().includes(q));

    if (filtered.length === 0) {
      target.innerHTML = `
        <div class="mentions-empty">
          <div class="empty-mention-icon">👤</div>
          <h4>No leaders found</h4>
          <p>Add your first leader to start monitoring public mentions.</p>
          <button onclick="document.getElementById('add-leader-modal')?.classList.add('show')" style="margin-top:14px;padding:10px 18px;background:#1769e0;color:#fff;border:0;border-radius:10px;font-weight:700;cursor:pointer">+ Add Leader</button>
        </div>`;
      return;
    }

    target.innerHTML = filtered.map(l => `
      <article class="leader-card" data-id="${l.id}" style="background:#fff;border:1px solid #e6eaf0;border-radius:16px;padding:18px;box-shadow:0 2px 12px rgba(15,23,42,.04)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
          <div style="display:flex;gap:12px;align-items:center">
            <div style="width:42px;height:42px;border-radius:50%;background:#eaf2ff;color:#0868dd;display:flex;align-items:center;justify-content:center;font-weight:800">${(l.full_name||"L").charAt(0)}</div>
            <div>
              <div style="font-weight:800;color:#10223b;font-size:14px">${escapeHtml(l.full_name)}</div>
              <div style="font-size:11px;color:#64748b">${escapeHtml(l.position||"")}${l.organization?" • "+escapeHtml(l.organization):""}</div>
            </div>
          </div>
          <span style="font-size:10px;font-weight:700;padding:5px 10px;border-radius:20px;background:${l.monitoring_enabled?"#ecfdf3":"#f1f5f9"};color:${l.monitoring_enabled?"#067647":"#64748b"}">${l.monitoring_enabled?"● Monitoring":"○ Paused"}</span>
        </div>
        <div style="display:flex;gap:8px;margin-top:14px">
          <button class="btn-toggle" data-id="${l.id}" style="flex:1;padding:8px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;font-size:11px;font-weight:700;cursor:pointer">${l.monitoring_enabled?"Pause":"Enable"}</button>
          <button class="btn-delete" data-id="${l.id}" style="padding:8px 12px;border:1px solid #fecaca;border-radius:8px;background:#fef2f2;color:#b42318;font-size:11px;font-weight:700;cursor:pointer">Delete</button>
        </div>
      </article>
    `).join("");

    // Bind buttons
    target.querySelectorAll(".btn-toggle").forEach(b=>{
      b.addEventListener("click", async ()=>{
        const id = b.dataset.id;
        const leader = allLeaders.find(x=>String(x.id)===String(id));
        if(!leader) return;
        await supabase.from("leaders").update({monitoring_enabled: !leader.monitoring_enabled}).eq("id", id);
        await loadLeaders();
      });
    });
    target.querySelectorAll(".btn-delete").forEach(b=>{
      b.addEventListener("click", async ()=>{
        if(!confirm("Delete this leader?")) return;
        await supabase.from("leaders").delete().eq("id", b.dataset.id);
        await loadLeaders();
      });
    });
  }

  // Events
  searchEl?.addEventListener("input", ()=> render(allLeaders));
  refreshBtn?.addEventListener("click", loadLeaders);
  
  // Fix search input selector from your HTML
  const realSearch = document.querySelector('input[placeholder*="Search leaders"]');
  if (realSearch && realSearch !== searchEl) {
    realSearch.addEventListener("input", (e)=>{
      if(searchEl) searchEl.value = e.target.value;
      render(allLeaders);
    });
  }

  await loadLeaders();
  console.log("CivicLens: leaders.js loaded successfully.");

  function escapeHtml(v){ return String(v||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
});