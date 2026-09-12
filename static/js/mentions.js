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

  // User check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href="/login"; return; }

  // Leaders
  let { data: leaders } = await supabase.from("leaders").select("*").eq("user_id", user.id);
  if (leaderEl) {
    leaderEl.innerHTML = `<option value="">All Leaders</option>` + (leaders||[]).map(l=>`<option value="${l.id}">${l.full_name}</option>`).join("");
  }
  if (!leaders || leaders.length===0) {
    container.innerHTML = `<div class="mentions-empty"><div class="empty-mention-icon">◉</div><h4>No leaders tracked</h4><p>Add a leader in Leaders page first, then come back.</p><a href="/leaders" class="btn btn-primary" style="margin-top:12px;display:inline-block;padding:10px 16px;background:#1769e0;color:#fff;border-radius:8px;text-decoration:none">Go to Leaders</a></div>`;
    return;
  }

  let allMentions = [];

  async function loadAndRender() {
    const { data: mentions, error } = await supabase.from("mentions").select("*, leaders(full_name)").eq("user_id", user.id).order("published_at",{ascending:false}).limit(100);
    if (error) { console.error(error); container.innerHTML = `<div class="mentions-error">Error: ${error.message}<br><br>Run in Supabase SQL: <code>CREATE POLICY "allow all" ON mentions FOR ALL USING (true) WITH CHECK (true);</code></div>`; return; }
    allMentions = mentions||[];
    render(allMentions);
    // Auto-collect if empty first time
    if (allMentions.length===0 && !sessionStorage.getItem("autoCollected")) {
      sessionStorage.setItem("autoCollected","1");
      await collectReal();
    }
  }

  function render(mentions) {
    const q = (searchEl?.value||"").toLowerCase().trim();
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

    if(countEl) countEl.textContent = `${filtered.length} ${filtered.length===1?"mention":"mentions"}`;
    if(totalEl) totalEl.textContent = filtered.length;
    if(posEl) posEl.textContent = filtered.filter(m=>m.sentiment==="positive").length;
    if(neuEl) neuEl.textContent = filtered.filter(m=>m.sentiment==="neutral").length;
    if(negEl) negEl.textContent = filtered.filter(m=>m.sentiment==="negative").length;

    if(!filtered.length){
      container.innerHTML = `<div class="mentions-empty"><div class="empty-mention-icon">◉</div><h4>No mentions found</h4><p>CivicLens hasn't collected mentions for this filter. Click Refresh to collect real public news about ${leaders[0]?.full_name||"your leaders"}.</p><button class="btn btn-primary" id="force-collect" style="margin-top:14px;padding:10px 18px;background:#1769e0;color:#fff;border:0;border-radius:10px;font-weight:700;cursor:pointer">↻ Collect Real News Now</button></div>`;
      document.getElementById("force-collect")?.addEventListener("click", collectReal);
      return;
    }

    container.innerHTML = filtered.map(m=>{
      const sent = (m.sentiment||"neutral").toLowerCase();
      const sentClass = sent==="positive"?"positive":sent==="negative"?"negative":"neutral";
      const leaderName = m.leaders?.full_name || leaders.find(l=>String(l.id)===String(m.leader_id))?.full_name || "Tracked Leader";
      const date = new Date(m.published_at||m.created_at).toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"});
      return `
        <article class="mention-card">
            <div class="mention-top">
                <div class="mention-author">
                    <div class="author-avatar">${(m.author||"N").charAt(0).toUpperCase()}</div>
                    <div>
                        <span class="author-name">${escapeHtml(m.author||"Google News")}</span>
                        <span class="author-handle">${escapeHtml(m.platform||"News")} • ${escapeHtml(date)}</span>
                    </div>
                </div>
                <div class="mention-meta">
                    <span class="platform-badge">${escapeHtml(m.platform||"News")}</span>
                    <span class="sentiment-badge ${sentClass}">${capitalize(sent)}</span>
                </div>
            </div>
            <p class="mention-content">${escapeHtml(m.content||"")}</p>
            <div class="mention-bottom">
                <span class="mention-leader">Mentioning: <strong>${escapeHtml(leaderName)}</strong></span>
                ${m.url?`<a class="view-post" href="${m.url}" target="_blank" rel="noopener">View Original Post →</a>`:""}
            </div>
        </article>`;
    }).join("");
  }

  async function collectReal() {
    if(refreshBtn){ refreshBtn.disabled=true; refreshBtn.textContent="🔎 Collecting..."; }
    container.innerHTML = `<div class="mentions-loading"><div class="loading-spinner"></div><p>Fetching real news for ${leaders.map(l=>l.full_name).join(", ")}...</p></div>`;
    let collected=0;
    try {
      for(const leader of leaders.slice(0,3)){
        const rss = encodeURIComponent(`https://news.google.com/rss/search?q=${encodeURIComponent(leader.full_name)}&hl=en-KE&gl=KE&ceid=KE:en`);
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${rss}`;
        const res = await fetch(apiUrl);
        const json = await res.json();
        if(json.status!=="ok") continue;
        for(const item of json.items.slice(0,5)){
          const { data: exists } = await supabase.from("mentions").select("id").eq("url", item.link).limit(1);
          if(exists?.length) continue;
          const txt = (item.title+" "+item.description).toLowerCase();
          let sentiment="neutral";
          if(["praised","win","support","development","launch","good","approve","praise"].some(w=>txt.includes(w))) sentiment="positive";
          if(["scandal","corrupt","protest","fail","accused","critic","arrest","controversy"].some(w=>txt.includes(w))) sentiment="negative";
          const clean = (item.title+" - "+(item.description||"")).replace(/<[^>]*>/g,"").slice(0,500);
          const { error } = await supabase.from("mentions").insert({ user_id: user.id, leader_id: leader.id, content: clean, platform: "News", sentiment, author: "Google News", url: item.link, published_at: item.pubDate||new Date().toISOString() });
          if(!error) collected++;
          else { container.innerHTML = `<div class="mentions-error"><b>RLS Blocked:</b> ${error.message}<br><br>Go to Supabase SQL Editor and run:<br><code style="background:#fff;padding:4px 8px;border-radius:4px;display:inline-block;margin-top:8px">CREATE POLICY "allow all" ON mentions FOR ALL USING (true) WITH CHECK (true);</code></div>`; return; }
        }
      }
      console.log(`Collected ${collected}`);
    } catch(e){ console.error(e); }
    finally{
      if(refreshBtn){ refreshBtn.disabled=false; refreshBtn.textContent="↻ Refresh"; }
      await loadAndRender();
    }
  }

  // Events
  refreshBtn?.addEventListener("click", collectReal);
  clearBtn?.addEventListener("click", ()=>{ if(searchEl) searchEl.value=""; if(leaderEl) leaderEl.value=""; if(platformEl) platformEl.value=""; if(sentimentEl) sentimentEl.value=""; render(allMentions); });
  let t; searchEl?.addEventListener("input", ()=>{ clearTimeout(t); t=setTimeout(()=>render(allMentions),250); });
  leaderEl?.addEventListener("change", ()=>render(allMentions));
  platformEl?.addEventListener("change", ()=>render(allMentions));
  sentimentEl?.addEventListener("change", ()=>render(allMentions));

  await loadAndRender();
  console.log("CivicLens: mentions.js PRO loaded");
  
  function escapeHtml(v){ return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function capitalize(v){ return v ? v.charAt(0).toUpperCase()+v.slice(1) : ""; }
});