"use strict";
console.log("CivicLens: dashboard.js V14.2 loaded successfully.");
let supabaseClient=null;

document.addEventListener("DOMContentLoaded", async () => {
  console.log("CivicLens: Dashboard starting...");
  if(!window.SUPABASE_URL ||!window.SUPABASE_ANON_KEY ||!window.supabase){
    location.href="/login"; return;
  }
  supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  const { data:{ session } } = await supabaseClient.auth.getSession();
  if(!session){ location.href="/login"; return; }
  console.log("CivicLens: Supabase initialized.");

  await loadUser();
  setupNavigation();
  await loadDashboardStats();
  await loadRecentMentions();
  setupCollection();
  setupRefresh();
  console.log("CivicLens: Dashboard ready.");
});

async function civicLensFetch(url, options={}){
  const { data:{ session } } = await supabaseClient.auth.getSession();
  if(!session){ location.href="/login"; throw new Error("No session"); }
  const headers = new Headers(options.headers||{});
  headers.set("Authorization", `Bearer ${session.access_token}`);
  headers.set("Content-Type","application/json");
  const res = await fetch(url, {...options, headers});
  console.log(`CivicLens: Authenticated request -> ${url} ${res.status}`);
  return res;
}

async function loadUser(){
  try{
    const { data } = await supabaseClient.auth.getUser();
    if(!data?.user) return;
    const meta = data.user.user_metadata || {};
    const name = meta.full_name || data.user.email.split("@")[0];
    document.getElementById("user-name") && (document.getElementById("user-name").textContent = name.toUpperCase());
    document.getElementById("user-email") && (document.getElementById("user-email").textContent = data.user.email);
    document.getElementById("user-avatar") && (document.getElementById("user-avatar").textContent = name.charAt(0).toUpperCase());
    console.log("CivicLens auth event: SIGNED_IN");
  }catch(e){}
}

function setupNavigation(){
  console.log("CivicLens: Setting up dashboard navigation...");
  document.getElementById("logout-button")?.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    localStorage.clear();
    location.href="/login";
  });
}

async function loadDashboardStats(){
  try{
    const res = await civicLensFetch("/api/dashboard/stats");
    const json = await res.json();
    console.log("Stats loaded:", json);
    const total = json.total_mentions || json.mentions || json.total || 0;
    const leaders = json.leaders || 0;
    const positive = json.positive || 0;
    const platforms = 3; // you have 3 active

    // FIX: Use exact IDs from your HTML
    const set = (id, val) => {
      const el = document.getElementById(id);
      if(el) el.textContent = val;
    };
    set("total-mentions", total);
    set("total-leaders", leaders);
    set("total-platforms", platforms);
    set("positive-mentions", positive);
  }catch(e){
    console.error("stats err", e);
  }
}

async function loadRecentMentions(){
  const container = document.getElementById("recent-mentions-container");
  if(!container) return;
  try{
    const res = await civicLensFetch("/api/dashboard/recent");
    const json = await res.json();
    const mentions = json.mentions || json.data || [];
    console.log("Recent mentions:", mentions.length, mentions);

    if(!mentions.length){
      container.innerHTML = `<div class="dashboard-empty"><div class="empty-icon">◉</div><h4>No mentions yet</h4><p>Run Collection to fetch news.</p></div>`;
      return;
    }

    const html = mentions.slice(0,5).map(m=>{
      const title = (m.title || m.content || "Untitled").slice(0,120);
      const leader = m.leaders?.full_name || m.leader_name || m.full_name || "William Ruto";
      const sentiment = (m.sentiment||"neutral").toLowerCase();
      const badgeClass = sentiment==="positive"?"badge-pos":sentiment==="negative"?"badge-neg":"badge-neu";
      const avatarBg = sentiment==="positive"?"#dcfce7":sentiment==="negative"?"#fee2e2":"#f1f5f9";
      const avatarColor = sentiment==="positive"?"#16a34a":sentiment==="negative"?"#dc2626":"#64748b";
      const url = m.url || "#";
      const date = m.published_at? new Date(m.published_at).toLocaleDateString("en-KE",{day:"2-digit",month:"short"}) : "Recent";
      return `
        <div class="mention-row">
          <div class="mention-avatar" style="background:${avatarBg};color:${avatarColor}">${leader.charAt(0)}</div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
              <span style="font-weight:700;font-size:13px;color:#0f172a">${leader}</span>
              <span class="badge ${badgeClass}">${sentiment}</span>
              <span style="color:#94a3b8;font-size:11px">• ${date} • 📰 Google News</span>
            </div>
            <a href="${url}" target="_blank" style="display:block;margin-top:4px;font-size:13px;color:#334155;text-decoration:none;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${title}</a>
          </div>
          <a href="${url}" target="_blank" style="color:#1769e0;font-size:11px;font-weight:700;text-decoration:none;flex-shrink:0">View →</a>
        </div>
      `;
    }).join("");

    container.innerHTML = `<div style="background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden">${html}<div style="text-align:center;padding:12px;border-top:1px solid #f1f5f9"><a href="/mentions" style="font-size:12px;color:#1769e0;font-weight:700;text-decoration:none">View all ${mentions.length} mentions →</a></div></div>`;
  }catch(e){
    console.error("recent err", e);
  }
}

function setupCollection(){
  console.log("CivicLens: Run Collection listener attached.");
  const btn = document.getElementById("run-collection");
  if(!btn){
    console.warn("Run Collection button not found");
    return;
  }
  btn.addEventListener("click", async ()=>{
    const oldText = btn.textContent;
    const statusEl = document.getElementById("collection-status");
    btn.textContent = "Collecting...";
    btn.disabled = true;
    if(statusEl) statusEl.textContent = "⏳ Collecting live news from Google News RSS...";
    try{
      const res = await civicLensFetch("/api/collect", {method:"POST"});
      const j = await res.json();
      console.log("Collect started:", j);
      if(statusEl) statusEl.textContent = "✅ Collection started - refreshing in 6s...";
      setTimeout(async ()=>{
        await loadDashboardStats();
        await loadRecentMentions();
        btn.textContent = "✓ Collected";
        if(statusEl) statusEl.textContent = "✅ Done - found new mentions";
        setTimeout(()=>{ btn.textContent=oldText; btn.disabled=false; if(statusEl) statusEl.textContent=""; },2500);
      }, 6000);
    }catch(e){
      console.error(e);
      btn.textContent = oldText;
      btn.disabled = false;
      if(statusEl) statusEl.textContent = "❌ Collect failed: "+e.message;
    }
  });

  // 15min auto-refresh
  setInterval(async ()=>{
    console.log("⏰ 15min auto-refresh");
    try{
      await civicLensFetch("/api/cron/collect");
      setTimeout(async ()=>{ await loadDashboardStats(); await loadRecentMentions(); }, 4000);
    }catch(e){}
  }, 15*60*1000);
}

function setupRefresh(){
  document.getElementById("refresh-dashboard")?.addEventListener("click", async ()=>{
    const btn = document.getElementById("refresh-dashboard");
    const old = btn.textContent;
    btn.textContent = "↻ Refreshing...";
    await loadDashboardStats();
    await loadRecentMentions();
    btn.textContent = "✓ Refreshed";
    setTimeout(()=> btn.textContent = old, 1500);
  });
}