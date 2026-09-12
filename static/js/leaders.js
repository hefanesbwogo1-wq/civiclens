"use strict";
document.addEventListener("DOMContentLoaded", async () => {
  const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  
  // --- FIND OR CREATE CONTAINER (THIS FIXES YOUR 450 ERROR) ---
  function getContainer() {
    let el = document.getElementById("leaders-container") 
          || document.getElementById("leaders-grid")
          || document.getElementById("leaders-list")
          || document.querySelector(".leaders-grid")
          || document.querySelector(".leaders-container")
          || document.querySelector("[data-leaders-container]");
    
    if (!el) {
      console.warn("CivicLens: leaders-container not found, creating it...");
      // Create it inside main content area
      const mainContent = document.querySelector(".main-content") 
                       || document.querySelector("main") 
                       || document.querySelector(".content")
                       || document.body;
      
      // Find where loading spinner is and replace it
      const loading = document.querySelector(".loading-container") || 
                      document.querySelector("p:contains('Loading leaders')");
      
      el = document.createElement("div");
      el.id = "leaders-container";
      el.className = "leaders-grid";
      el.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;margin-top:20px";
      
      // If there's a loading element, replace it
      if (loading && loading.parentElement) {
        loading.parentElement.appendChild(el);
        loading.style.display = "none";
      } else if (mainContent) {
        mainContent.appendChild(el);
      }
      console.log("CivicLens: Created leaders-container", el);
    }
    return el;
  }

  const searchEl = document.getElementById("search-leaders") 
                || document.querySelector('input[placeholder*="Search leaders"]')
                || document.querySelector('input[type="search"]');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href="/login"; return; }

  let allLeaders = [];

  async function loadLeaders() {
    const container = getContainer();
    if (!container) {
      console.error("CivicLens: Cannot find or create container!");
      return [];
    }

    // Show loading
    container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#718096">
      <div class="loading-spinner" style="width:28px;height:28px;margin:0 auto 12px;border:3px solid #e7edf5;border-top-color:#0868dd;border-radius:50%;animation:spin .8s linear infinite"></div>
      Loading leaders...
    </div><style>@keyframes spin{to{transform:rotate(360deg)}}</style>`;

    let leaders = [];
    try {
      // Try 1: with user_id
      const r1 = await supabase.from("leaders").select("*").eq("user_id", user.id).order("created_at", {ascending: false});
      console.log("CivicLens: Leaders with user_id:", r1.data?.length, "error:", r1.error);
      if (r1.data && r1.data.length > 0) leaders = r1.data;

      // Try 2: fallback all
      if (leaders.length === 0) {
        const r2 = await supabase.from("leaders").select("*").order("created_at", {ascending: false}).limit(100);
        console.log("CivicLens: Leaders fallback all:", r2.data?.length, r2.error);
        if (r2.data) leaders = r2.data;
      }
    } catch (e) {
      console.error("CivicLens: loadLeaders exception", e);
    }

    allLeaders = leaders || [];
    console.log("CivicLens: Leaders loaded:", allLeaders.length);
    renderLeaders(allLeaders);
    return allLeaders;
  }

  function renderLeaders(list) {
    const container = getContainer();
    if (!container) {
      console.error("CivicLens: leaders-container not found - cannot render");
      return;
    }

    const q = (searchEl?.value || "").toLowerCase().trim();
    let filtered = list.filter(l => {
      if (!q) return true;
      return `${l.full_name||""} ${l.public_name||""} ${l.organization||""} ${l.position||""}`.toLowerCase().includes(q);
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:80px 30px;color:#718096;background:#fff;border:1px solid #e7edf5;border-radius:14px">
          <div style="width:60px;height:60px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#edf5ff;color:#0868dd;font-size:22px">👤</div>
          <h4 style="margin:0 0 7px;color:#1c2b40">No leaders found</h4>
          <p style="font-size:13px">No leaders match "${escapeHtml(q)}" or none added yet.</p>
        </div>`;
      return;
    }

    container.innerHTML = filtered.map(l => {
      const initial = (l.full_name||"L").charAt(0).toUpperCase();
      const statusBg = l.monitoring_enabled ? "#eafaf1" : "#f2f5f8";
      const statusColor = l.monitoring_enabled ? "#16834b" : "#657384";
      const statusText = l.monitoring_enabled ? "● Monitoring" : "○ Paused";
      return `
      <article class="leader-card" style="background:#fff;border:1px solid #e7edf5;border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div style="display:flex;gap:12px;align-items:center">
            <div style="width:42px;height:42px;border-radius:50%;background:#eaf2ff;color:#0868dd;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px">${escapeHtml(initial)}</div>
            <div>
              <div style="font-weight:800;font-size:14px;color:#10223b">${escapeHtml(l.full_name)}</div>
              <div style="font-size:11px;color:#7b8797;margin-top:2px">${escapeHtml(l.position||"Leader")}${l.organization?" • "+escapeHtml(l.organization):""}</div>
            </div>
          </div>
          <span style="font-size:9px;font-weight:800;letter-spacing:.5px;padding:6px 10px;border-radius:20px;background:${statusBg};color:${statusColor}">${statusText}</span>
        </div>
        <div style="display:flex;gap:8px;margin-top:6px">
          <button class="btn-toggle" data-id="${l.id}" style="flex:1;padding:9px;border:1px solid #e4eaf2;background:#f7f9fc;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer">${l.monitoring_enabled?"Pause":"Resume"}</button>
          <button class="btn-delete" data-id="${l.id}" style="padding:9px 12px;border:1px solid #fecdca;background:#fff0f0;color:#b42318;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer">Delete</button>
        </div>
      </article>`;
    }).join("");

    // Bind actions
    container.querySelectorAll(".btn-toggle").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const leader = allLeaders.find(x => String(x.id) === String(id));
        if (!leader) return;
        btn.disabled = true;
        btn.textContent = "Updating...";
        const { error } = await supabase.from("leaders").update({ monitoring_enabled: !leader.monitoring_enabled }).eq("id", id);
        if (error) { alert("Error: "+error.message); btn.disabled = false; }
        else { await loadLeaders(); }
      });
    });

    container.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this leader? This cannot be undone.")) return;
        const { error } = await supabase.from("leaders").delete().eq("id", btn.dataset.id);
        if (error) alert("Error: "+error.message);
        else await loadLeaders();
      });
    });
  }

  // Search
  if (searchEl) {
    searchEl.addEventListener("input", () => renderLeaders(allLeaders));
  }
  // Also bind the actual input in your screenshot (with placeholder "Search leaders...")
  const realSearch = document.querySelector('input[placeholder="Search leaders..."]');
  if (realSearch) {
    realSearch.addEventListener("input", (e) => {
      if (searchEl && searchEl !== realSearch) searchEl.value = e.target.value;
      // Update searchEl reference
      const q = e.target.value;
      const container = getContainer();
      if (container) {
        // quick filter without reload
        const filtered = allLeaders.filter(l => !q || `${l.full_name} ${l.organization||""}`.toLowerCase().includes(q.toLowerCase()));
        renderLeaders(q ? filtered : allLeaders);
        // Actually just call render with all and let it use searchEl? easier:
        if (searchEl) searchEl.value = q;
        renderLeaders(allLeaders);
      }
    });
  }

  // Refresh button
  document.getElementById("refresh-button")?.addEventListener("click", loadLeaders);
  document.getElementById("refresh-leaders")?.addEventListener("click", loadLeaders);
  document.querySelectorAll('[id*="refresh"]').forEach(b => b.addEventListener("click", loadLeaders));

  // Initial load
  await loadLeaders();
  console.log("CivicLens: leaders.js loaded successfully - container:", !!getContainer(), "leaders:", allLeaders.length);

  function escapeHtml(v){ return String(v||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
});