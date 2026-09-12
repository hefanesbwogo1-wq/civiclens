"use strict";
console.log("CivicLens: leaders.js file loaded V6 FINAL");

document.addEventListener("DOMContentLoaded", async () => {
  console.log("CivicLens: leaders.js initializing...");
  
  // Wait for config.js
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    console.error("Missing SUPABASE_URL - check config.js");
    return;
  }

  const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  console.log("CivicLens: Supabase initialized.");

  // --- FIX 1: GET CONTAINER (fixes leaders-container not found at line 450) ---
  function getContainer() {
    let el = document.getElementById("leaders-container");
    if (!el) {
      el = document.querySelector(".leaders-grid");
    }
    if (!el) {
      // Emergency create if HTML missing it
      el = document.createElement("div");
      el.id = "leaders-container";
      el.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;padding:20px";
      const main = document.querySelector(".content") || document.querySelector(".main") || document.body;
      main.appendChild(el);
      console.log("CivicLens: Created emergency leaders-container");
    }
    return el;
  }

  const container = getContainer();
  console.log("CivicLens: leaders-container found?", !!container);

  // --- FIX 2: AUTH (fixes Invalid or expired session + 401) ---
  // No /api/leaders call anymore - direct Supabase
  console.log("CivicLens: Loading leaders...");
  
  let { data: { user }, error: userErr } = await supabase.auth.getUser();
  
  if (userErr || !user) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log("No session, redirect to login");
      window.location.href = "/login.html";
      return;
    }
    user = session.user;
  }

  console.log("CivicLens: User", user.id);

  // --- LOAD LEADERS ---
  async function loadLeaders() {
    const c = getContainer();
    c.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px;color:#94a3b8">
        <div style="width:28px;height:28px;border:3px solid #e2e8f0;border-top-color:#1769e0;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 12px"></div>
        Loading leaders...
      </div>
      <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
    `;

    try {
      // Try with user_id first
      let { data, error } = await supabase
        .from("leaders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      console.log("CivicLens: Leaders with user_id:", data?.length, error);

      // Fallback: if RLS allows null user_id or old data
      if ((!data || data.length === 0) && !error) {
        const r2 = await supabase
          .from("leaders")
          .select("*")
          .limit(100)
          .order("created_at", { ascending: false });
        console.log("CivicLens: Leaders fallback (all):", r2.data?.length);
        if (r2.data && r2.data.length > 0) data = r2.data;
      }

      if (error) throw error;

      console.log("CivicLens: Leaders loaded:", data.length);

      if (!data || data.length === 0) {
        c.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:80px 20px;background:#fff;border:1px solid #e2e8f0;border-radius:16px">
            <div style="font-size:40px">👤</div>
            <h3 style="margin-top:10px;color:#0f172a">No leaders yet</h3>
            <p style="font-size:13px;color:#64748b;margin-top:6px">Add your first leader to start monitoring mentions</p>
          </div>`;
        return;
      }

      renderLeaders(data);

    } catch (err) {
      console.error("CivicLens leaders loading error:", err);
      c.innerHTML = `<div style="grid-column:1/-1;padding:20px;background:#fef2f2;border:1px solid #fecaca;border-radius:12px;color:#b42318">Error: ${err.message}</div>`;
    }
  }

  // --- RENDER (this was line 450 before) ---
  function renderLeaders(list) {
    const c = getContainer();
    if (!c) {
      console.error("CivicLens: leaders-container not found");
      return;
    }

    c.innerHTML = list.map(l => `
      <div style="background:#fff;border:1px solid #e7edf5;border-radius:14px;padding:18px;box-shadow:0 2px 8px rgba(0,0,0,.03)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div style="display:flex;gap:12px;align-items:center">
            <div style="width:44px;height:44px;border-radius:50%;background:#eaf2ff;color:#1769e0;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px">${(l.full_name || "L").charAt(0).toUpperCase()}</div>
            <div>
              <div style="font-weight:800;color:#0f172a;font-size:14px">${l.full_name}</div>
              <div style="font-size:11px;color:#64748b;margin-top:2px">${l.position || ""} ${l.organization ? "• " + l.organization : ""}</div>
            </div>
          </div>
          <span style="font-size:10px;padding:4px 10px;border-radius:20px;background:${l.monitoring_enabled ? "#dcfce7" : "#f1f5f9"};color:${l.monitoring_enabled ? "#166534" : "#64748b"};font-weight:700">${l.monitoring_enabled ? "● Monitoring" : "○ Paused"}</span>
        </div>
        <div style="display:flex;gap:8px;margin-top:16px">
          <button data-id="${l.id}" data-enabled="${l.monitoring_enabled}" class="toggle-btn" style="flex:1;padding:9px;border:1px solid #e2e8f0;border-radius:9px;background:#f8fafc;font-size:12px;font-weight:700;cursor:pointer">${l.monitoring_enabled ? "Pause" : "Resume"}</button>
          <button data-id="${l.id}" class="delete-btn" style="padding:9px 14px;border:1px solid #fecaca;background:#fef2f2;color:#b42318;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer">Delete</button>
        </div>
      </div>
    `).join("");

    // Bind events
    c.querySelectorAll(".toggle-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const enabled = btn.dataset.enabled === "true";
        btn.textContent = "Updating...";
        await supabase.from("leaders").update({ monitoring_enabled: !enabled }).eq("id", id);
        await loadLeaders();
      });
    });

    c.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this leader?")) return;
        await supabase.from("leaders").delete().eq("id", btn.dataset.id);
        await loadLeaders();
      });
    });

    console.log("CivicLens: leaders.js loaded successfully. Rendered", list.length);
  }

  // --- INIT ---
  await loadLeaders();

  // Search
  const searchInput = document.getElementById("search-leaders");
  if (searchInput) {
    searchInput.addEventListener("input", async (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) { await loadLeaders(); return; }
      const { data } = await supabase.from("leaders").select("*").eq("user_id", user.id);
      const filtered = (data || []).filter(l => `${l.full_name} ${l.organization || ""} ${l.position || ""}`.toLowerCase().includes(q));
      if (filtered.length === 0) {
        getContainer().innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:#94a3b8">No match for "${q}"</div>`;
      } else {
        renderLeaders(filtered);
      }
    });
  }

  // Buttons
  document.getElementById("refresh-leaders")?.addEventListener("click", loadLeaders);
  
  document.getElementById("add-leader-btn")?.addEventListener("click", () => {
    document.getElementById("add-leader-modal").style.display = "flex";
  });
  
  document.getElementById("close-modal")?.addEventListener("click", () => {
    document.getElementById("add-leader-modal").style.display = "none";
  });
});

// Global helpers for inline onclick (backup)
window.toggleLeader = async (id, cur) => {
  const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  await supabase.from("leaders").update({ monitoring_enabled: !cur }).eq("id", id);
  location.reload();
};
window.deleteLeader = async (id) => {
  if (!confirm("Delete?")) return;
  const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  await supabase.from("leaders").delete().eq("id", id);
  location.reload();
};