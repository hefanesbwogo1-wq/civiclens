"use strict";
console.log("CivicLens: leaders.js file loaded.");
document.addEventListener("DOMContentLoaded", async () => {
  console.log("CivicLens: leaders.js initializing...");

  // Get Supabase client
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    console.error("Missing SUPABASE_URL / ANON_KEY in config.js");
    return;
  }
  const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  console.log("CivicLens: Supabase initialized.");

  // Find container - your HTML has it as .main content
  let container = document.getElementById("leaders-container") 
               || document.getElementById("leaders-grid")
               || document.querySelector(".leaders-grid");
  
  // If not found, create it where "Loading leaders..." is
  if (!container) {
    const loadingText = Array.from(document.querySelectorAll("*")).find(el => el.textContent.trim() === "Loading leaders...");
    if (loadingText) {
      container = document.createElement("div");
      container.id = "leaders-container";
      container.className = "leaders-grid";
      container.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;margin-top:20px;padding:20px";
      loadingText.parentElement.replaceWith(container);
    } else {
      container = document.createElement("div");
      container.id = "leaders-container";
      container.className = "leaders-grid";
      container.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;margin:20px";
      document.querySelector(".main")?.appendChild(container) || document.body.appendChild(container);
    }
  }

  console.log("CivicLens: Loading leaders...");

  // AUTH CHECK - This fixes the Invalid or expired session error
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    console.log("No session, trying getUser...");
    const { data: { user: user2 }, error: userError } = await supabase.auth.getUser();
    if (userError || !user2) {
      console.error("No auth, redirect to login", userError);
      window.location.href = "/login";
      return;
    }
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("CivicLens leaders loading error: Invalid or expired session.");
    window.location.href = "/login";
    return;
  }

  console.log("User:", user.id);

  async function loadLeaders() {
    try {
      container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:#64748b"><div style="width:32px;height:32px;margin:0 auto 12px;border:3px solid #e2e8f0;border-top-color:#1769e0;border-radius:50%;animation:spin .8s linear infinite"></div>Loading leaders...</div><style>@keyframes spin{to{transform:rotate(360deg)}}</style>`;

      // DIRECT SUPABASE - NO /api/leaders call, so NO 401
      let { data: leaders, error } = await supabase
        .from("leaders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      console.log("Leaders with user_id:", leaders?.length, error);

      // Fallback if user_id is null in DB
      if ((!leaders || leaders.length === 0) && !error) {
        let r2 = await supabase.from("leaders").select("*").limit(50).order("created_at", { ascending: false });
        console.log("Leaders fallback (all):", r2.data?.length, r2.error);
        if (r2.data && r2.data.length > 0) leaders = r2.data;
      }

      if (error) throw error;

      console.log(`CivicLens: Leaders loaded: ${leaders.length}`);

      if (leaders.length === 0) {
        container.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:80px 20px;background:#fff;border:1px solid #e2e8f0;border-radius:16px">
            <div style="font-size:40px;margin-bottom:12px">👤</div>
            <h3 style="color:#0f172a">No leaders yet</h3>
            <p style="color:#64748b;font-size:13px;margin-top:6px">Add your first leader to start monitoring</p>
            <button onclick="document.getElementById('add-leader-modal').style.display='flex'" style="margin-top:16px;padding:10px 18px;background:#1769e0;color:#fff;border:0;border-radius:10px;font-weight:700;cursor:pointer">+ Add Leader</button>
          </div>`;
        return;
      }

      container.innerHTML = leaders.map(l => `
        <div style="background:#fff;border:1px solid #e7edf5;border-radius:16px;padding:18px;box-shadow:0 2px 8px rgba(0,0,0,.03)">
          <div style="display:flex;justify-content:space-between;align-items:start">
            <div style="display:flex;gap:12px;align-items:center">
              <div style="width:44px;height:44px;border-radius:50%;background:#eaf2ff;color:#1769e0;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px">${(l.full_name||"L").charAt(0).toUpperCase()}</div>
              <div>
                <div style="font-weight:800;color:#0f172a;font-size:14px">${l.full_name}</div>
                <div style="font-size:11px;color:#64748b;margin-top:2px">${l.position||""} ${l.organization ? "• "+l.organization : ""}</div>
              </div>
            </div>
            <span style="font-size:10px;padding:5px 10px;border-radius:20px;background:${l.monitoring_enabled?'#dcfce7':'#f1f5f9'};color:${l.monitoring_enabled?'#166534':'#64748b'};font-weight:700">${l.monitoring_enabled?'● Monitoring':'○ Paused'}</span>
          </div>
          <div style="display:flex;gap:8px;margin-top:16px">
            <button data-action="toggle" data-id="${l.id}" data-enabled="${l.monitoring_enabled}" style="flex:1;padding:9px;border:1px solid #e2e8f0;border-radius:9px;background:#f8fafc;font-size:12px;font-weight:700;cursor:pointer">${l.monitoring_enabled?'Pause':'Resume'}</button>
            <button data-action="delete" data-id="${l.id}" style="padding:9px 14px;border:1px solid #fecaca;background:#fef2f2;color:#b42318;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer">Delete</button>
          </div>
        </div>
      `).join("");

      // Bind buttons
      container.querySelectorAll("[data-action='toggle']").forEach(btn=>{
        btn.addEventListener("click", async ()=>{
          const id = btn.dataset.id;
          const enabled = btn.dataset.enabled === "true";
          btn.textContent = "Updating...";
          await supabase.from("leaders").update({ monitoring_enabled: !enabled }).eq("id", id);
          await loadLeaders();
        });
      });
      container.querySelectorAll("[data-action='delete']").forEach(btn=>{
        btn.addEventListener("click", async ()=>{
          if(!confirm("Delete this leader?")) return;
          await supabase.from("leaders").delete().eq("id", btn.dataset.id);
          await loadLeaders();
        });
      });

      console.log("CivicLens: leaders.js loaded successfully.");

    } catch (err) {
      console.error("CivicLens leaders loading error:", err);
      container.innerHTML = `<div style="grid-column:1/-1;padding:20px;background:#fef2f2;border:1px solid #fecaca;border-radius:12px;color:#b42318">Error: ${err.message}<br><br>Fix: Go to Supabase SQL and run:<br><code>CREATE POLICY "allow all leaders" ON leaders FOR ALL USING (true) WITH CHECK (true);</code></div>`;
    }
  }

  async function initializeLeaders() {
    await loadLeaders();
  }

  await initializeLeaders();

  // Search
  const searchInput = document.getElementById("search-leaders") || document.querySelector('input[placeholder*="Search leaders"]');
  if (searchInput) {
    searchInput.addEventListener("input", async (e)=>{
      const q = e.target.value.toLowerCase().trim();
      if (!q) { await loadLeaders(); return; }
      const { data } = await supabase.from("leaders").select("*").eq("user_id", user.id);
      const filtered = (data||[]).filter(l => `${l.full_name} ${l.organization||""} ${l.position||""}`.toLowerCase().includes(q));
      // quick render filtered
      if (filtered.length === 0) {
        container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:#94a3b8">No leaders match "${q}"</div>`;
      } else {
        container.innerHTML = filtered.map(l => `
          <div style="background:#fff;border:1px solid #e7edf5;border-radius:16px;padding:18px">
            <div style="display:flex;gap:12px;align-items:center">
              <div style="width:44px;height:44px;border-radius:50%;background:#eaf2ff;color:#1769e0;display:flex;align-items:center;justify-content:center;font-weight:800">${(l.full_name||"L").charAt(0)}</div>
              <div><div style="font-weight:800">${l.full_name}</div><div style="font-size:11px;color:#64748b">${l.organization||""}</div></div>
            </div>
          </div>
        `).join("");
      }
    });
  }

  document.getElementById("refresh-leaders")?.addEventListener("click", loadLeaders);
});