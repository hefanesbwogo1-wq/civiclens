"use strict";
document.addEventListener("DOMContentLoaded", initializeMentions);
let supabaseClient = null;
const elements = {};
let allMentions = [];
let allLeaders = [];

async function initializeMentions() {
  cacheElements();
  initializeSupabase();
  if (!supabaseClient) { showError("Config unavailable."); return; }
  const auth = await verifySession();
  if (!auth) return;
  await loadUser();
  await loadLeaders();
  await loadMentions();
  setupEvents();
}

function cacheElements() {
  elements.search = document.getElementById("search-input");
  elements.leader = document.getElementById("leader-filter");
  elements.platform = document.getElementById("platform-filter");
  elements.sentiment = document.getElementById("sentiment-filter");
  elements.clear = document.getElementById("clear-filters");
  elements.refresh = document.getElementById("refresh-button");
  elements.container = document.getElementById("mentions-container");
  elements.count = document.getElementById("mention-count");
  elements.statTotal = document.getElementById("stat-total");
  elements.statPositive = document.getElementById("stat-positive");
  elements.statNeutral = document.getElementById("stat-neutral");
  elements.statNegative = document.getElementById("stat-negative");
  elements.testStatus = document.getElementById("test-mention-status");
}

function initializeSupabase() {
  if (!window.supabase ||!window.SUPABASE_URL ||!window.SUPABASE_ANON_KEY) return;
  supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
}
async function verifySession() {
  try { const { data } = await supabaseClient.auth.getSession(); if (!data?.session) { window.location.href="/login"; return false; } return true; }
  catch { window.location.href="/login"; return false; }
}

async function loadUser() {
  try { const { data } = await supabaseClient.auth.getUser(); if(!data?.user) return; const el=document.getElementById("user-name"); if(el) el.textContent=data.user.email?.split("@")[0]||"User"; } catch {}
}

async function loadLeaders() {
  try {
    const { data, error } = await supabaseClient.from('leaders').select('*').eq('monitoring_enabled', true);
    if(error) throw error;
    allLeaders = data || [];
    if(!elements.leader) return;
    elements.leader.innerHTML = `<option value="">All Leaders</option>`;
    allLeaders.forEach(l => {
      const opt = document.createElement("option");
      opt.value = l.id;
      opt.textContent = l.full_name;
      elements.leader.appendChild(opt);
    });
  } catch(e){ console.error(e); }
}

async function loadMentions() {
  showLoading();
  try {
    const { data, error } = await supabaseClient.from('mentions').select('*, leaders(full_name)').order('published_at', {ascending:false}).limit(100);
    if(error) throw error;
    allMentions = data || [];
    if(allMentions.length===0 &&!sessionStorage.getItem("autoCollected")){
      sessionStorage.setItem("autoCollected","1");
      await triggerCollect();
      return;
    }
    applyFiltersAndRender();
  } catch(e){ showError(e.message); }
  finally{ hideLoading(); }
}

async function triggerCollect() {
  if(elements.refresh){ elements.refresh.disabled=true; elements.refresh.textContent="🔎 Collecting..."; }
  if(elements.testStatus) elements.testStatus.textContent="Collecting real news from Google...";

  try {
    // Try backend first
    let backendWorked = false;
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      const r = await fetch("/api/collect", { method:"POST", headers:{ "Authorization": `Bearer ${session.access_token}`, "Content-Type":"application/json" } });
      if(r.ok){ backendWorked = true; console.log("Backend collect worked"); }
    } catch {}

    if(!backendWorked){
      // FRONTEND COLLECT - WORKS WITHOUT API
      console.log("Doing frontend collect");
      const { data: { user } } = await supabaseClient.auth.getUser();
      let collected = 0;

      for(const leader of allLeaders.slice(0,3)){ // limit 3 leaders to avoid rate limit
        const query = encodeURIComponent(leader.full_name);
        const rssUrl = encodeURIComponent(`https://news.google.com/rss/search?q=${query}&hl=en-KE&gl=KE&ceid=KE:en`);
        try {
          // Use free rss2json to bypass CORS
          const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`;
          const res = await fetch(apiUrl);
          const json = await res.json();
          if(json.status!== 'ok') continue;

          for(const item of json.items.slice(0,4)){
            // Check duplicate by url
            const { data: exists } = await supabaseClient.from('mentions').select('id').eq('url', item.link).limit(1);
            if(exists && exists.length>0) continue;

            const text = (item.title + " " + item.description).toLowerCase();
            let sentiment = 'neutral';
            if(['praised','wins','support','development','launch','good'].some(w=>text.includes(w))) sentiment='positive';
            if(['scandal','corrupt','protest','fails','accused','criticized'].some(w=>text.includes(w))) sentiment='negative';

            await supabaseClient.from('mentions').insert({
              user_id: user.id,
              leader_id: leader.id,
              content: (item.title + " - " + (item.description||"")).replace(/<[^>]*>/g,"").slice(0,500),
              platform: 'News',
              sentiment,
              author: 'Google News',
              url: item.link,
              published_at: item.pubDate || new Date().toISOString()
            });
            collected++;
          }
        } catch(err){ console.log("RSS fail", err); }
      }
      if(elements.testStatus) elements.testStatus.textContent = collected>0? `Collected ${collected} real mentions!` : "No new mentions found - try adding leaders like 'William Ruto'";
    }

    await loadMentions();
  } catch(e){
    console.error(e);
    showError("Collect failed: "+e.message);
    if(elements.testStatus) elements.testStatus.textContent = "Collect failed: "+e.message;
  } finally {
    if(elements.refresh){ elements.refresh.disabled=false; elements.refresh.textContent="↻ Refresh"; }
  }
}
window.triggerCollect = triggerCollect;

function applyFiltersAndRender() {
  let filtered = [...allMentions];
  const search = (elements.search?.value||"").toLowerCase().trim();
  const leaderId = elements.leader?.value||"";
  const sentiment = elements.sentiment?.value||"";
  const platform = elements.platform?.value||"";

  if(search) filtered = filtered.filter(m => `${m.content} ${m.author} ${m.leaders?.full_name||""}`.toLowerCase().includes(search));
  if(leaderId) filtered = filtered.filter(m => String(m.leader_id)===String(leaderId));
  if(sentiment) filtered = filtered.filter(m => (m.sentiment||"").toLowerCase()===sentiment.toLowerCase());
  if(platform) filtered = filtered.filter(m => (m.platform||"").toLowerCase()===platform.toLowerCase());

  renderMentions(filtered);
  updateStats(filtered);
}

function renderMentions(list) {
  if(elements.count) elements.count.textContent = `${list.length} mentions`;
  if(!list.length){
    elements.container.innerHTML = `<div class="empty-state"><div class="empty-icon">◉</div><h2>No mentions yet</h2><p>We didn't find news for your current leaders. Add a leader like "William Ruto" and click Refresh.</p><button class="btn btn-primary" style="margin-top:14px" onclick="triggerCollect()">↻ Collect Real News Now</button></div>`;
    return;
  }
  elements.container.innerHTML = list.map(m=>{
    const leader = m.leaders || allLeaders.find(l=>String(l.id)===String(m.leader_id));
    const sent = (m.sentiment||"neutral").toLowerCase();
    return `<article class="cl-mention"><div class="cl-m-top"><span class="cl-m-platform">${escapeHtml(m.platform||"News")}</span><span class="cl-m-sent ${sent}">${sent}</span><span style="margin-left:auto;font-size:11px;color:#667085">${new Date(m.published_at).toLocaleDateString()}</span></div><p class="cl-m-content">${escapeHtml(m.content||"")}</p><div class="cl-m-bottom"><span class="cl-m-leader">📌 ${escapeHtml(leader?.full_name||"Leader")}</span><a href="${m.url||"#"}" target="_blank" class="cl-m-link">View Source →</a></div></article>`;
  }).join("");
}

function setupEvents() {
  let t;
  if(elements.search) elements.search.addEventListener("input", ()=>{ clearTimeout(t); t=setTimeout(applyFiltersAndRender,250); });
  if(elements.leader) elements.leader.addEventListener("change", applyFiltersAndRender);
  if(elements.platform) elements.platform.addEventListener("change", applyFiltersAndRender);
  if(elements.sentiment) elements.sentiment.addEventListener("change", applyFiltersAndRender);
  if(elements.clear) elements.clear.addEventListener("click", ()=>{ elements.search.value=""; elements.leader.value=""; elements.platform.value=""; elements.sentiment.value=""; applyFiltersAndRender(); });
  if(elements.refresh) elements.refresh.addEventListener("click", triggerCollect);
  const testBtn = document.getElementById("test-mention-button") || document.querySelector("button:contains('Create Test Mention')");
  if(testBtn) testBtn.onclick = triggerCollect;
  document.getElementById("test-mention-button")?.addEventListener("click", triggerCollect);
}

function updateStats(list){ if(elements.statTotal) elements.statTotal.textContent=list.length; if(elements.statPositive) elements.statPositive.textContent=list.filter(m=>m.sentiment==='positive').length; if(elements.statNeutral) elements.statNeutral.textContent=list.filter(m=>m.sentiment==='neutral').length; if(elements.statNegative) elements.statNegative.textContent=list.filter(m=>m.sentiment==='negative').length; }
function showLoading(){ if(elements.container) elements.container.innerHTML=`<div class="loading-state"><div class="spinner"></div><p>Loading...</p></div>`; }
function hideLoading(){}
function showError(m){ if(elements.container) elements.container.innerHTML=`<div style="background:#fef2f2;border:1px solid #fecaca;padding:14px;border-radius:10px;color:#b42318;text-align:center">${m}</div>`; }
function escapeHtml(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }