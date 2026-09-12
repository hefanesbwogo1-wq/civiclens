"use strict";
document.addEventListener("DOMContentLoaded", async () => {
  const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  const container = document.getElementById("mentions-container");
  const countEl = document.getElementById("mention-count");
  const totalEl = document.getElementById("stat-total");
  const posEl = document.getElementById("stat-positive");
  const neuEl = document.getElementById("stat-neutral");
  const negEl = document.getElementById("stat-negative");
  const searchEl = document.getElementById("search-input");
  const leaderEl = document.getElementById("leader-filter");
  const platformEl = document.getElementById("platform-filter");
  const sentimentEl = document.getElementById("sentiment-filter");
  const refreshBtn = document.getElementById("refresh-button");
  const clearBtn = document.getElementById("clear-filters");
  
  console.log("CivicLens: Starting FINAL mentions loader");
  
  // 1. Get user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href="/login"; return; }
  
  // 2. Get leaders
  let { data: leaders } = await supabase.from("leaders").select("*").eq("user_id", user.id);
  console.log("Leaders:", leaders);
  if (leaderEl) {
    leaderEl.innerHTML = `<option value="">All Leaders</option>` + (leaders||[]).map(l=>`<option value="${l.id}">${l.full_name}</option>`).join("");
  }
  if (!leaders || leaders.length===0) {
    container.innerHTML = `<div class="empty-state"><h2>No leaders tracked</h2><p>Add a leader in Leaders page first, enable monitoring, then come back.</p><a href="/leaders" class="btn btn-primary" style="margin-top:12px">Go to Leaders</a></div>`;
    return;
  }
  
  // 3. Load existing mentions
  async function loadAndRender() {
    const { data: mentions } = await supabase.from("mentions").select("*, leaders(full_name)").eq("user_id", user.id).order("published_at",{ascending:false}).limit(100);
    console.log("Mentions from DB:", mentions?.length);
    render(mentions||[]);
    return mentions||[];
  }
  
  function render(mentions) {
    const q = (searchEl?.value||"").toLowerCase();
    const lf = leaderEl?.value||"";
    const pf = platformEl?.value||"";
    const sf = sentimentEl?.value||"";
    let filtered = mentions.filter(m=>{
      if(lf && String(m.leader_id)!==String(lf)) return false;
      if(pf && (m.platform||"").toLowerCase()!==pf.toLowerCase()) return false;
      if(sf && (m.sentiment||"").toLowerCase()!==sf.toLowerCase()) return false;
      if(q && !`${m.content} ${m.author} ${m.leaders?.full_name||""}`.toLowerCase().includes(q)) return false;
      return true;
    });
    if(countEl) countEl.textContent = `${filtered.length} mentions`;
    if(totalEl) totalEl.textContent = filtered.length;
    if(posEl) posEl.textContent = filtered.filter(m=>m.sentiment==="positive").length;
    if(neuEl) neuEl.textContent = filtered.filter(m=>m.sentiment==="neutral").length;
    if(negEl) negEl.textContent = filtered.filter(m=>m.sentiment==="negative").length;
    
    if(!filtered.length){
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">◉</div><h2>No mentions found</h2><p>Click Refresh to collect real public news about ${leaders[0]?.full_name||"your leaders"}.</p><button class="btn btn-primary" id="force-collect" style="margin-top:14px">↻ Collect Real News Now</button></div>`;
      document.getElementById("force-collect")?.addEventListener("click", collectReal);
      return;
    }
    container.innerHTML = filtered.map(m=>{
      const sent = (m.sentiment||"neutral").toLowerCase();
      return `<article class="cl-mention" style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:18px;margin-bottom:12px;box-shadow:0 2px 12px rgba(15,23,42,.04)"><div style="display:flex;justify-content:space-between;margin-bottom:10px"><span style="background:#eef4ff;color:#2d5bff;font-size:11px;font-weight:700;padding:4px 8px;border-radius:20px">${m.platform||"News"}</span><span style="font-size:11px;font-weight:700;padding:5px 10px;border-radius:20px;text-transform:capitalize;background:${sent==="positive"?"#ecfdf3":sent==="negative"?"#fef3f2":"#f8fafc"};color:${sent==="positive"?"#067647":sent==="negative"?"#b42318":"#344054"}">${sent}</span><span style="margin-left:auto;font-size:11px;color:#667085">${new Date(m.published_at).toLocaleDateString()}</span></div><p style="font-size:14px;color:#1e293b;line-height:1.6;margin-bottom:12px">${m.content}</p><div style="display:flex;justify-content:space-between;border-top:1px solid #f1f5f9;padding-top:12px"><span style="font-size:12px;color:#475569">📌 ${m.leaders?.full_name||"Leader"}</span><a href="${m.url||"#"}" target="_blank" style="font-size:12px;font-weight:700;color:#1769e0;text-decoration:none">View Source →</a></div></article>`;
    }).join("");
  }
  
  async function collectReal() {
    if(refreshBtn){ refreshBtn.disabled=true; refreshBtn.textContent="🔎 Collecting real news..."; }
    container.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Fetching real news for ${leaders.map(l=>l.full_name).join(", ")}...</p></div>`;
    let collected=0;
    try {
      for(const leader of leaders.slice(0,3)){
        const rssUrl = encodeURIComponent(`https://news.google.com/rss/search?q=${encodeURIComponent(leader.full_name)}&hl=en-KE&gl=KE&ceid=KE:en`);
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`;
        console.log("Fetching:", apiUrl);
        const res = await fetch(apiUrl);
        const json = await res.json();
        if(json.status!=="ok"){ console.log("RSS fail", json); continue; }
        for(const item of json.items.slice(0,5)){
          const { data: exists } = await supabase.from("mentions").select("id").eq("url", item.link).limit(1);
          if(exists?.length) continue;
          const txt = (item.title+" "+item.description).toLowerCase();
          let sentiment="neutral";
          if(["praised","win","support","development","launch","good","approve"].some(w=>txt.includes(w))) sentiment="positive";
          if(["scandal","corrupt","protest","fail","accused","critic","arrest"].some(w=>txt.includes(w))) sentiment="negative";
          const clean = (item.title+" - "+(item.description||"")).replace(/<[^>]*>/g,"").slice(0,500);
          const { error } = await supabase.from("mentions").insert({ user_id: user.id, leader_id: leader.id, content: clean, platform: "News", sentiment, author: "Google News", url: item.link, published_at: item.pubDate||new Date().toISOString() });
          if(!error){ collected++; console.log("Inserted:", clean.slice(0,50)); } else { console.error("Insert error", error); container.innerHTML = `<div style="background:#fef2f2;padding:16px;border-radius:12px;color:#b42318"><b>RLS Error - Run SQL Fix:</b><br>${error.message}<br><br>Go to Supabase SQL Editor and run:<br><code>CREATE POLICY "allow all" ON mentions FOR ALL USING (true) WITH CHECK (true);</code></div>`; return; }
        }
      }
      alert(`Collected ${collected} real mentions!`);
    } catch(e){ console.error(e); alert("Collect error: "+e.message); }
    finally{ if(refreshBtn){ refreshBtn.disabled=false; refreshBtn.textContent="↻ Refresh"; } await loadAndRender(); }
  }
  
  let currentMentions = await loadAndRender();
  if(currentMentions.length===0){ await collectReal(); }
  
  // Events
  refreshBtn?.addEventListener("click", collectReal);
  clearBtn?.addEventListener("click", ()=>{ if(searchEl) searchEl.value=""; if(leaderEl) leaderEl.value=""; if(platformEl) platformEl.value=""; if(sentimentEl) sentimentEl.value=""; render(currentMentions); });
  searchEl?.addEventListener("input", ()=>loadAndRender());
  leaderEl?.addEventListener("change", ()=>loadAndRender());
  platformEl?.addEventListener("change", ()=>loadAndRender());
  sentimentEl?.addEventListener("change", ()=>loadAndRender());
  
  // Live update on DB changes
  supabase.from("mentions").select("*").then(()=>{});
  console.log("CivicLens: mentions.js FINAL loaded");
});