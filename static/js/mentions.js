"use strict";
document.addEventListener("DOMContentLoaded", initializeMentions);
let supabaseClient = null;
const elements = {};
let allMentions = [];
let allLeaders = [];

async function initializeMentions() {
  cacheElements();
  initializeSupabase();
  if (!supabaseClient) { showError("CivicLens configuration is unavailable."); return; }
  const auth = await verifySession();
  if (!auth) return;
  await loadUser();
  await loadLeaders();
  await loadMentions();
  setupEvents();
  console.log("CivicLens: mentions.js loaded successfully.");
}

function cacheElements() {
  elements.userName = document.getElementById("user-name");
  elements.userEmail = document.getElementById("user-email");
  elements.userAvatar = document.getElementById("user-avatar");
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
  elements.logout = document.getElementById("logout-button");
  elements.testMention = document.getElementById("test-mention-button");
  elements.testStatus = document.getElementById("test-mention-status");
}

function initializeSupabase() {
  if (!window.supabase || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) return;
  supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
}
async function verifySession() {
  try { const { data } = await supabaseClient.auth.getSession(); if (!data?.session) { window.location.href="/login"; return false; } return true; } 
  catch { window.location.href="/login"; return false; }
}
async function civicLensFetch(url, options={}) {
  const { data } = await supabaseClient.auth.getSession();
  if (!data?.session) { window.location.href="/login"; throw new Error("Session expired"); }
  const headers = new Headers(options.headers||{});
  headers.set("Authorization", `Bearer ${data.session.access_token}`);
  headers.set("Accept", "application/json");
  return fetch(url, {...options, headers});
}

async function loadUser() {
  try { const { data } = await supabaseClient.auth.getUser(); if(!data?.user) return; const name = data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "User"; if(elements.userName) elements.userName.textContent=name; if(elements.userEmail) elements.userEmail.textContent=data.user.email; if(elements.userAvatar) elements.userAvatar.textContent=name.charAt(0).toUpperCase(); } catch {}
}

async function loadLeaders() {
  try {
    const res = await civicLensFetch("/api/leaders");
    const result = await res.json();
    const leaders = result.leaders || result || [];
    allLeaders = leaders;
    if(!elements.leader) return;
    const current = elements.leader.value;
    elements.leader.innerHTML = `<option value="">All Leaders</option>`;
    leaders.forEach(l => {
      const opt = document.createElement("option");
      opt.value = l.id; // use ID for filtering
      opt.textContent = l.full_name || l.public_name || "Unnamed";
      opt.dataset.name = (l.full_name||"").toLowerCase();
      elements.leader.appendChild(opt);
    });
    if(current) elements.leader.value = current;
  } catch(e){ console.error("Leader filter error", e); }
}

async function loadMentions() {
  showLoading();
  try {
    const res = await civicLensFetch("/api/mentions");
    const result = await res.json();
    if(!res.ok) throw new Error(result.error||"Unable to load mentions");
    allMentions = result.mentions || [];
    // If empty, auto-collect real news once
    if(allMentions.length===0 && !sessionStorage.getItem("autoCollected")){
      sessionStorage.setItem("autoCollected","1");
      await triggerCollect(true);
      return;
    }
    applyFiltersAndRender();
  } catch(e){
    console.error(e);
    showError("Unable to load mentions. Click Refresh to collect real news.");
  }
}

function applyFiltersAndRender() {
  let filtered = [...allMentions];
  const search = (elements.search?.value||"").toLowerCase().trim();
  const leaderId = elements.leader?.value||"";
  const platform = elements.platform?.value||"";
  const sentiment = elements.sentiment?.value||"";

  if(search) filtered = filtered.filter(m => `${m.content} ${m.author} ${m.platform} ${m.leaders?.full_name||""}`.toLowerCase().includes(search));
  if(leaderId) filtered = filtered.filter(m => String(m.leader_id)===String(leaderId));
  if(platform) filtered = filtered.filter(m => (m.platform||"").toLowerCase()===platform.toLowerCase());
  if(sentiment) filtered = filtered.filter(m => (m.sentiment||"").toLowerCase()===sentiment.toLowerCase());

  renderMentions(filtered);
  updateStats(filtered);
}

function renderMentions(mentions) {
  if(elements.count) elements.count.textContent = `${mentions.length} ${mentions.length===1?"mention":"mentions"}`;
  if(!mentions.length){
    elements.container.innerHTML = `
      <div class="empty-state" style="border-style:dashed">
        <div class="empty-icon">◉</div>
        <h2>No mentions found</h2>
        <p>No public mentions matching your filters. Click Refresh to collect real news for your tracked leaders.</p>
        <button class="btn btn-primary" style="margin-top:14px" onclick="triggerCollect()">↻ Collect Real News</button>
      </div>`;
    return;
  }
  elements.container.innerHTML = mentions.map(createMentionCard).join("");
}

function createMentionCard(m) {
  const leader = m.leaders || allLeaders.find(l=>String(l.id)===String(m.leader_id));
  const author = escapeHtml(m.author||"News Source");
  const content = escapeHtml(m.content||"");
  const platform = escapeHtml(m.platform||"News");
  const sentiment = (m.sentiment||"neutral").toLowerCase();
  const avatar = author.charAt(0).toUpperCase();
  const date = formatDate(m.published_at||m.created_at);
  const link = isValidHttpUrl(m.url||m.post_url) ? `<a class="cl-m-link" href="${escapeAttribute(m.url||m.post_url)}" target="_blank" rel="noopener">View Source →</a>` : "";
  const sentClass = sentiment==="positive"?"pos":sentiment==="negative"?"neg":"neu";
  
  return `
  <article class="cl-mention">
    <div class="cl-m-top">
      <div class="cl-m-author-row"><div class="cl-m-avatar">${avatar}</div><div><span class="cl-m-author-name">${author}</span><span class="cl-m-platform-inline">${platform}</span></div></div>
      <span class="cl-m-sent ${sentClass}">${capitalize(sentiment)}</span>
    </div>
    <p class="cl-m-content">${content}</p>
    <div class="cl-m-bottom">
      <span class="cl-m-leader">📌 ${escapeHtml(leader?.full_name||leader?.public_name||"Tracked Leader")} • ${escapeHtml(date)}</span>
      ${link}
    </div>
  </article>`;
}

async function triggerCollect(silent=false) {
  if(elements.refresh){ elements.refresh.disabled=true; elements.refresh.textContent="🔎 Collecting real news..."; }
  if(elements.testStatus) elements.testStatus.textContent="Collecting real public mentions...";
  try {
    const res = await civicLensFetch("/api/collect", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({}) });
    const j = await res.json();
    if(!res.ok) throw new Error(j.error||"Collect failed");
    console.log("Collected", j.collected);
    const mentionsRes = await civicLensFetch("/api/mentions");
    const mentionsJson = await mentionsRes.json();
    allMentions = mentionsJson.mentions||[];
    applyFiltersAndRender();
    if(elements.testStatus) elements.testStatus.textContent = j.collected>0 ? `Collected ${j.collected} new real mentions!` : "Already up to date - no new mentions.";
  } catch(e){
    console.error(e);
    if(!silent) showError(e.message);
  } finally {
    if(elements.refresh){ elements.refresh.disabled=false; elements.refresh.textContent="↻ Refresh"; }
  }
}
window.triggerCollect = triggerCollect;

async function createTestMention() {
  await triggerCollect();
}

function setupEvents() {
  let t;
  if(elements.search) elements.search.addEventListener("input", ()=>{ clearTimeout(t); t=setTimeout(applyFiltersAndRender,250); });
  if(elements.leader) elements.leader.addEventListener("change", applyFiltersAndRender);
  if(elements.platform) elements.platform.addEventListener("change", applyFiltersAndRender);
  if(elements.sentiment) elements.sentiment.addEventListener("change", applyFiltersAndRender);
  if(elements.clear) elements.clear.addEventListener("click", ()=>{ if(elements.search) elements.search.value=""; if(elements.leader) elements.leader.value=""; if(elements.platform) elements.platform.value=""; if(elements.sentiment) elements.sentiment.value=""; applyFiltersAndRender(); });
  if(elements.refresh) elements.refresh.addEventListener("click", ()=>triggerCollect());
  if(elements.testMention) elements.testMention.addEventListener("click", triggerCollect);
  if(elements.logout) elements.logout.addEventListener("click", async()=>{ await supabaseClient.auth.signOut(); window.location.href="/login"; });
}

function updateStats(list) {
  const total = list.length;
  const pos = list.filter(m=>(m.sentiment||"").toLowerCase()==="positive").length;
  const neu = list.filter(m=>(m.sentiment||"").toLowerCase()==="neutral").length;
  const neg = list.filter(m=>(m.sentiment||"").toLowerCase()==="negative").length;
  if(elements.statTotal) elements.statTotal.textContent=total;
  if(elements.statPositive) elements.statPositive.textContent=pos;
  if(elements.statNeutral) elements.statNeutral.textContent=neu;
  if(elements.statNegative) elements.statNegative.textContent=neg;
}

function showLoading(){ if(elements.container) elements.container.innerHTML=`<div class="loading-state"><div class="spinner"></div><p>Loading mentions...</p></div>`; }
function showError(msg){ if(elements.container) elements.container.innerHTML=`<div class="mentions-error" style="background:#fef2f2;border:1px solid #fecaca;padding:14px;border-radius:10px;color:#b42318">${escapeHtml(msg)}</div>`; }
function formatDate(v){ if(!v) return "Recently"; const d=new Date(v); return isNaN(d.getTime())?String(v):d.toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"}); }
function capitalize(v){ return v? v.charAt(0).toUpperCase()+v.slice(1):""; }
function escapeHtml(v){ return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
function escapeAttribute(v){ return String(v).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function isValidHttpUrl(v){ try{ const u=new URL(v); return u.protocol==="http:"||u.protocol==="https:"; } catch{ return false; } }