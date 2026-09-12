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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href="/login"; return; }

  // --- LEADERS: FAULT-TOLERANT LOADER ---
  let leaders = [];
  try {
    // Try 1: with user_id
    let res1 = await supabase.from("leaders").select("*").eq("user_id", user.id);
    console.log("Leaders with user_id:", res1.data, "error:", res1.error);
    if (res1.data && res1.data.length > 0) leaders = res1.data;

    // Try 2: if empty, try all (no filter) - fixes null user_id or RLS
    if (leaders.length === 0) {
      let res2 = await supabase.from("leaders").select("*").limit(50);
      console.log("Leaders fallback all:", res2.data, "error:", res2.error);
      if (res2.data && res2.data.length > 0) leaders = res2.data;
    }

    // Try 3: if still empty, try monitoring_enabled = true only
    if (leaders.length === 0) {
      let res3 = await supabase.from("leaders").select("*").eq("monitoring_enabled", true).limit(50);
      console.log("Leaders fallback monitoring:", res3.data);
      if (res3.data && res3.data.length > 0) leaders = res3.data;
    }
  } catch (e) {
    console.error("Leaders load exception:", e);
  }

  // Fill dropdown ALWAYS
  if (leaderEl) {
    leaderEl.innerHTML = `<option value="">All Leaders (${leaders.length})</option>` + 
      (leaders||[]).map(l=>`<option value="${l.id}">${escapeHtml(l.full_name || l.name || "Unnamed")}</option>`).join("");
  }

  if (!leaders || leaders.length === 0) {
    container.innerHTML = `
      <div class="mentions-empty">
        <div class="empty-mention-icon">⚠️</div>
        <h4>No leaders found in database</h4>
        <p style="max-width:520px;margin:10px auto;line-height:1.6">
          Your <code>leaders</code> table is empty or RLS is blocking it.<br><br>
          <b>Quick Fix - Run in Supabase SQL Editor:</b><br>
          <code style="background:#f1f5f9;padding:8px 10px;border-radius:8px;display:block;margin:10px 0;text-align:left;white-space:pre-wrap">CREATE POLICY "allow all leaders" ON leaders FOR ALL USING (true) WITH CHECK (true);
UPDATE leaders SET user_id = auth.uid() WHERE user_id IS NULL;
UPDATE leaders SET monitoring_enabled = true;</code>
        </p>
        <a href="/leaders" style="display:inline-block;margin-top:14px;padding:10px 18px;background:#1769e0;color:#fff;border-radius:10px;text-decoration:none;font-weight:700">Go to Leaders Page</a>
      </div>`;
    if(countEl) countEl.textContent = "0 mentions";
    if(totalEl) totalEl.textContent = "0";
    return;
  }

  let allMentions = [];

  async function loadAndRender() {
    // Try with user_id, fallback to all
    let query = supabase.from("mentions").select("*, leaders(full_name)").order("published_at",{ascending:false}).limit(100);
    let { data: mentions, error } = await query.eq("user_id", user.id);
    
    if (error || !mentions || mentions.length === 0) {
      let fallback = await supabase.from("mentions").select("*, leaders(full_name)").order("published_at",{ascending:false}).limit(100);
      if (!fallback.error && fallback.data && fallback.data.length > 0) {
        mentions = fallback.data;
        error = null;
      }
    }

    if (error) {
      console.error(error);
      container.innerHTML = `<div class="mentions-error">Error: ${error.message}<br><br>Run in Supabase SQL: <code>CREATE POLICY "allow all" ON mentions FOR ALL USING (true) WITH CHECK (true);</code></div>`;
      return;
    }
    
    allMentions = mentions||[];
    render(allMentions);
    
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
      container.innerHTML = `<div class="mentions-empty"><div class="empty-mention-icon">◉</div><h4>No mentions found</h4><p>We have ${leaders.length} leaders but no news yet for this filter. Click to collect real Google News.</p><button id="force-collect" style="margin-top:14px;padding:11px 18px;background:#1769e0;color:#fff;border:0;border-radius:10px;font-weight:700;cursor:pointer">↻ Collect Real News for ${escapeHtml(leaders[0]?.full_name||"Leaders")}</button></div>`;
      document.getElementById("force-collect")?.addEventListener("click", collectReal);
      return;
    }

    container.innerHTML = filtered.map(m=>{
      const sent = (m.sentiment||"neutral").toLowerCase();
      const sentClass = sent==="positive"?"positive":sent==="negative"?"negative":"neutral";
      const leaderName = m.leaders?.full_name || leaders.find(l=>String(l.id)===String(m.leader_id))?.full_name || "Tracked Leader";
      const date = new Date(m.published_at||m.created_at).toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"});
      const avatar = (m.author||"N").charAt(0).toUpperCase();
      return `
        <article class="mention-card">
            <div class="mention-top">
                <div class="mention-author">
                    <div class="author-avatar">${escapeHtml(avatar)}</div>
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
    if(refreshBtn){ refreshBtn.disabled=true; refreshBtn.textContent="🔎 Collecting real news..."; }
    container.innerHTML = `<div class="mentions-loading"><div class="loading-spinner"></div><p>Fetching real news for ${leaders.map(l=>l.full_name).join(", ")}...</p></div>`;
    let collected=0;
    try {
      for(const leader of leaders.slice(0,3)){
        const rss = encodeURIComponent(`https://news.google.com/rss/search?q=${encodeURIComponent(leader.full_name)}&hl=en-KE&gl=KE&ceid=KE:en`);
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${rss}`;
        console.log("Fetching news for", leader.full_name);
        const res = await fetch(apiUrl);
        const json = await res.json();
        if(json.status!=="ok"){ console.log("RSS fail for", leader.full_name, json); continue; }
        for(const item of json.items.slice(0,5)){
          const { data: exists } = await supabase.from("mentions").select("id").eq("url", item.link).limit(1);
          if(exists?.length) continue;
          const txt = (item.title+" "+(item.description||"")).toLowerCase();
          let sentiment="neutral";
          if(["praised","win","support","development","launch","good","approve","praise","commends","hails"].some(w=>txt.includes(w))) sentiment="positive";
          if(["scandal","corrupt","protest","fail","accused","critic","arrest","controversy","condemn","slams"].some(w=>txt.includes(w))) sentiment="negative";
          const clean = (item.title+" - "+(item.description||"")).replace(/<[^>]*>/g,"").slice(0,500);
          const { error } = await supabase.from("mentions").insert({ 
            user_id: user.id, 
            leader_id: leader.id, 
            content: clean, 
            platform: "News", 
            sentiment, 
            author: "Google News", 
            url: item.link, 
            published_at: item.pubDate||new Date().toISOString() 
          });
          if(!error){ collected++; } 
          else {
            console.error("Insert error:", error);
            // If RLS blocks, show fix but keep going
            if(error.message.includes("policy") || error.message.includes("RLS")){
              container.innerHTML = `<div class="mentions-error"><b>RLS Blocked:</b> ${error.message}<br><br>Run this in Supabase SQL:<br><code style="background:#fff;padding:6px 10px;border-radius:6px;display:inline-block;margin-top:8px">CREATE POLICY "allow all" ON mentions FOR ALL USING (true) WITH CHECK (true);</code></div>`;
              return;
            }
          }
        }
      }
      console.log(`Collected ${collected} real mentions`);
    } catch(e){ console.error("Collect exception:", e); }
    finally{
      if(refreshBtn){ refreshBtn.disabled=false; refreshBtn.textContent="↻ Refresh"; }
      await loadAndRender();
    }
  }

  refreshBtn?.addEventListener("click", collectReal);
  clearBtn?.addEventListener("click", ()=>{ 
    if(searchEl) searchEl.value=""; 
    if(leaderEl) leaderEl.value=""; 
    if(platformEl) platformEl.value=""; 
    if(sentimentEl) sentimentEl.value=""; 
    render(allMentions); 
  });
  let t; 
  searchEl?.addEventListener("input", ()=>{ clearTimeout(t); t=setTimeout(()=>render(allMentions),250); });
  leaderEl?.addEventListener("change", ()=>render(allMentions));
  platformEl?.addEventListener("change", ()=>render(allMentions));
  sentimentEl?.addEventListener("change", ()=>render(allMentions));

  await loadAndRender();
  console.log("CivicLens: FINAL mentions.js loaded with", leaders.length, "leaders");

  function escapeHtml(v){ return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
  function capitalize(v){ return v ? v.charAt(0).toUpperCase()+v.slice(1) : ""; }
});