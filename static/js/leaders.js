"use strict";
console.log("CivicLens: leaders.js file loaded V7 REAL FETCH");

document.addEventListener("DOMContentLoaded", async () => {
  console.log("CivicLens: leaders.js initializing...");

  if (!window.SUPABASE_URL ||!window.SUPABASE_ANON_KEY) {
    console.error("Missing SUPABASE_URL - check /static/js/config.js");
    return;
  }

  const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  console.log("CivicLens: Supabase initialized.");

  function getContainer() {
    let el = document.getElementById("leaders-container");
    if (!el) el = document.querySelector(".leaders-grid");
    if (!el) {
      el = document.createElement("div");
      el.id = "leaders-container";
      el.className = "leaders-grid";
      (document.querySelector(".content") || document.body).appendChild(el);
    }
    return el;
  }

  const container = getContainer();

  let { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = "/login"; return; }
    user = session.user;
  }
  console.log("CivicLens: User", user.id);

  async function loadLeaders() {
    const c = getContainer();
    c.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:#94a3b8"><div style="width:28px;height:28px;border:3px solid #e2e8f0;border-top-color:#1769e0;border-radius:50%;animation:spin.8s linear infinite;margin:0 auto 12px"></div>Loading leaders...</div><style>@keyframes spin{to{transform:rotate(360deg)}}</style>`;
    try {
      let { data, error } = await supabase.from("leaders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if ((!data || data.length === 0) &&!error) {
        const r2 = await supabase.from("leaders").select("*").limit(100).order("created_at", { ascending: false });
        if (r2.data?.length) data = r2.data;
      }
      if (error) throw error;
      console.log("CivicLens: Leaders loaded:", data?.length);
      if (!data?.length) {
        c.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:80px 20px;background:#fff;border:1px solid #e2e8f0;border-radius:16px"><div style="font-size:40px">👤</div><h3 style="margin-top:10px">No leaders yet</h3><p style="font-size:13px;color:#64748b;margin-top:6px">Add leader with keywords to start REAL monitoring</p></div>`;
        return;
      }
      renderLeaders(data);
    } catch (err) {
      console.error(err);
      c.innerHTML = `<div style="grid-column:1/-1;padding:20px;background:#fef2f2;border-radius:12px;color:#b42318">Error: ${err.message}</div>`;
    }
  }

  function renderLeaders(list) {
    const c = getContainer();
    c.innerHTML = list.map(l => {
      const keywords = l.search_keywords || l.keywords || "";
      const initials = (l.full_name || "L").charAt(0).toUpperCase();
      return `<div style="background:#fff;border:1px solid #e7edf5;border-radius:14px;padding:18px">
        <div style="display:flex;justify-content:space-between">
          <div style="display:flex;gap:12px;align-items:center">
            <div style="width:44px;height:44px;border-radius:50%;background:#eaf2ff;color:#1769e0;display:flex;align-items:center;justify-content:center;font-weight:800">${initials}</div>
            <div>
              <div style="font-weight:800;color:#0f172a;font-size:14px">${l.full_name}</div>
              <div style="font-size:11px;color:#64748b">${l.position || ""} ${l.county? "• " + l.county : ""}</div>
              <div style="font-size:10px;color:#1769e0;margin-top:2px;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">🔍 ${keywords || l.full_name}</div>
            </div>
          </div>
          <span style="font-size:10px;padding:4px 10px;border-radius:20px;background:${l.monitoring_enabled!== false? "#dcfce7" : "#f1f5f9"};color:${l.monitoring_enabled!== false? "#166534" : "#64748b"};font-weight:700">${l.monitoring_enabled!== false? "● Monitoring" : "○ Paused"}</span>
        </div>
        <div style="display:flex;gap:8px;margin-top:16px">
          <button data-id="${l.id}" data-enabled="${l.monitoring_enabled!== false}" class="toggle-btn" style="flex:1;padding:9px;border:1px solid #e2e8f0;border-radius:9px;background:#f8fafc;font-size:12px;font-weight:700;cursor:pointer">${l.monitoring_enabled!== false? "Pause" : "Resume"}</button>
          <button data-id="${l.id}" class="delete-btn" style="padding:9px 14px;border:1px solid #fecaca;background:#fef2f2;color:#b42318;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer">Delete</button>
        </div>
      </div>`;
    }).join("");

    c.querySelectorAll(".toggle-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id; const enabled = btn.dataset.enabled === "true";
        await supabase.from("leaders").update({ monitoring_enabled:!enabled }).eq("id", id);
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

  await loadLeaders();

  // Search
  document.getElementById("search-leaders")?.addEventListener("input", async (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) { await loadLeaders(); return; }
    const { data } = await supabase.from("leaders").select("*").eq("user_id", user.id);
    const filtered = (data || []).filter(l => `${l.full_name} ${l.position || ""} ${l.search_keywords || ""}`.toLowerCase().includes(q));
    renderLeaders(filtered);
  });

  document.getElementById("refresh-leaders")?.addEventListener("click", loadLeaders);

  // Modal open/close
  const modal = document.getElementById("add-leader-modal");
  document.getElementById("add-leader-btn")?.addEventListener("click", () => {
    modal.classList.add("show");
    // auto-fill keywords from name
    const nameInput = document.getElementById("leader-name");
    nameInput.addEventListener("blur", () => {
      const kw = document.getElementById("leader-keywords");
      if (!kw.value && nameInput.value) kw.value = `${nameInput.value}, ${nameInput.value.split(" ").pop()} Kenya`;
    }, { once: true });
  });
  function closeModal() { modal.classList.remove("show"); document.getElementById("add-leader-form").reset(); }
  document.getElementById("close-modal")?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  window.closeAddModal = closeModal;

  // --- REAL ADD WITH KEYWORDS ---
  document.getElementById("add-leader-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true; submitBtn.textContent = "Adding...";

    try {
      const full_name = document.getElementById("leader-name").value.trim();
      const aliases = document.getElementById("leader-aliases").value.trim();
      const position = document.getElementById("leader-position").value.trim();
      const county = document.getElementById("leader-county").value.trim();
      const organization = document.getElementById("leader-org").value.trim();
      const twitter = document.getElementById("leader-twitter").value.trim().replace("@", "");
      let search_keywords = document.getElementById("leader-keywords").value.trim();

      if (!search_keywords) search_keywords = [full_name, aliases, position].filter(Boolean).join(", ");

      const payload = {
        full_name, name: full_name, position, organization, county,
        aliases, twitter_handle: twitter,
        search_keywords, keywords: search_keywords,
        country: "Kenya", monitoring_enabled: true,
        user_id: user.id
      };

      console.log("CivicLens: Inserting leader", payload);
      const { data, error } = await supabase.from("leaders").insert([payload]).select();
      if (error) throw error;

      console.log("CivicLens: Leader added, will auto-collect news", data);
      closeModal();
      await loadLeaders();

      // Optional: trigger immediate collection for this leader
      if (confirm(`Leader "${full_name}" added with keywords: ${search_keywords}\n\nGo to Mentions to collect real news now?`)) {
        window.location.href = "/mentions";
      }

    } catch (err) {
      console.error(err);
      alert("Failed to add leader: " + err.message);
    } finally {
      submitBtn.disabled = false; submitBtn.textContent = "Add & Start Real Tracking";
    }
  });
});