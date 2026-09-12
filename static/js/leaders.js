"use strict";
let supabaseClient = null;
let leaders = [];
const elements = {};

document.addEventListener("DOMContentLoaded", initializeLeaders);

async function initializeLeaders() {
  console.log("CivicLens: leaders.js initializing...");
  cacheElements();
  initializeSupabase();
  if (!supabaseClient) { showPageError("CivicLens configuration is unavailable."); return; }
  const authenticated = await verifySession();
  if (!authenticated) return;
  setupEventHandlers();
  await loadUserProfile();
  await loadLeaders();
  // FORCE hide after 500ms just in case
  setTimeout(() => { forceHideLoading(); }, 500);
  console.log("CivicLens: leaders.js loaded successfully.");
}

function cacheElements() {
  elements.userName = document.getElementById("user-name");
  elements.userEmail = document.getElementById("user-email");
  elements.userAvatar = document.getElementById("user-avatar");
  elements.leadersContainer = document.getElementById("leaders-container") || document.getElementById("leaders-grid");
  elements.loadingEl = document.getElementById("leaders-loading");
  elements.emptyEl = document.getElementById("leaders-empty");
  elements.errorEl = document.getElementById("leaders-error") || document.getElementById("page-error");
  elements.leaderCount = document.getElementById("leader-count");
  elements.search = document.getElementById("leader-search") || document.getElementById("search-input");
  elements.addButton = document.getElementById("add-leader-btn");
  elements.emptyAddButton = document.getElementById("empty-add-leader");
  elements.refreshButton = document.getElementById("refresh-leaders");
  elements.logoutButton = document.getElementById("logout-btn") || document.getElementById("logout-button");
  elements.modal = document.getElementById("leader-modal");
  elements.modalOverlay = document.getElementById("modal-overlay");
  elements.modalTitle = document.getElementById("modal-title");
  elements.form = document.getElementById("leader-form");
  elements.closeModal = document.getElementById("close-modal");
  elements.cancelButton = document.getElementById("cancel-modal") || document.getElementById("cancel-button");
  elements.fullName = document.getElementById("full-name");
  elements.publicName = document.getElementById("public-name");
  elements.position = document.getElementById("position");
  elements.organization = document.getElementById("organization");
  elements.keywords = document.getElementById("keywords");
  elements.nicknames = document.getElementById("nicknames");
  elements.monitoringEnabled = document.getElementById("monitoring-enabled");
  elements.submitButton = document.getElementById("save-leader-btn") || document.getElementById("save-leader-button");
  elements.formError = document.getElementById("form-error");
  elements.pageError = document.getElementById("page-error") || document.getElementById("leaders-error");
  console.log("CivicLens: elements cached", { addBtn: !!elements.addButton, refreshBtn: !!elements.refreshButton, container: !!elements.leadersContainer, loading: !!elements.loadingEl });
}

function initializeSupabase() {
  if (!window.supabase || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) { console.error("Supabase config unavailable"); return; }
  try { supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY); console.log("CivicLens: Supabase initialized."); }
  catch (e) { console.error("Supabase init failed", e); }
}
async function verifySession() {
  try { const { data } = await supabaseClient.auth.getSession(); if (!data?.session) { window.location.href = "/login"; return false; } return true; }
  catch { window.location.href = "/login"; return false; }
}
async function civicLensFetch(url, options = {}) {
  const { data } = await supabaseClient.auth.getSession();
  if (!data?.session) { window.location.href = "/login"; throw new Error("Session expired"); }
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${data.session.access_token}`);
  headers.set("Accept", "application/json");
  return fetch(url, { ...options, headers });
}
async function loadUserProfile() {
  try { const { data } = await supabaseClient.auth.getUser(); if (!data?.user) return; const name = data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "User"; if (elements.userName) elements.userName.textContent = name; if (elements.userEmail) elements.userEmail.textContent = data.user.email; if (elements.userAvatar) elements.userAvatar.textContent = name.charAt(0).toUpperCase(); } catch {}
}
async function loadLeaders() {
  showLoading();
  try {
    console.log("CivicLens: Loading leaders...");
    const response = await civicLensFetch("/api/leaders");
    const result = await readJson(response);
    if (!response.ok) throw new Error(result?.detail || "Unable to load leaders");
    leaders = Array.isArray(result?.leaders) ? result.leaders : [];
    console.log("CivicLens: Leaders loaded:", leaders.length);
    renderLeaders(leaders);
    updateLeaderCount();
  } catch (e) {
    console.error(e);
    showPageError(e.message);
    forceHideLoading();
  }
}
async function readJson(res) { try { return await res.json(); } catch { const t = await res.text(); try { return JSON.parse(t); } catch { return { message: t }; } } }
function renderLeaders(list) {
  forceHideLoading();
  if (!elements.leadersContainer) return;
  if (!list.length) { elements.leadersContainer.innerHTML = ""; if (elements.emptyEl) elements.emptyEl.classList.remove("hidden"); return; }
  if (elements.emptyEl) elements.emptyEl.classList.add("hidden");
  elements.leadersContainer.innerHTML = list.map(createLeaderCard).join("");
}
function createLeaderCard(leader) {
  const id = escapeAttribute(leader.id || "");
  const fullName = escapeHtml(leader.full_name || "Unnamed");
  const publicName = escapeHtml(leader.public_name || "");
  const position = escapeHtml(leader.position || "");
  const organization = escapeHtml(leader.organization || "");
  const monitoring = Boolean(leader.monitoring_enabled);
  const keywords = escapeHtml(leader.keywords || "");
  const nicknames = escapeHtml(leader.nicknames || "");
  return `<article class="leader-card"><div class="leader-card-header"><div class="leader-avatar">${escapeHtml((leader.public_name || leader.full_name || "L").charAt(0).toUpperCase())}</div><div class="leader-card-title"><h3>${fullName}</h3>${publicName ? `<span>${publicName}</span>` : ""}</div><span class="status-badge ${monitoring ? "active" : "inactive"}">${monitoring ? "Monitoring" : "Paused"}</span></div><div class="leader-card-body">${position ? `<p><strong>Position:</strong> ${position}</p>` : ""}${organization ? `<p><strong>Org:</strong> ${organization}</p>` : ""}${keywords ? `<p><strong>Keywords:</strong> ${keywords}</p>` : ""}${nicknames ? `<p><strong>Nicknames:</strong> ${nicknames}</p>` : ""}</div><div class="leader-card-actions"><button type="button" class="secondary-button" data-action="edit-leader" data-leader-id="${id}">Edit</button><button type="button" class="secondary-button" data-action="toggle-monitoring" data-leader-id="${id}">${monitoring ? "Pause" : "Monitor"}</button><button type="button" class="danger-button" data-action="delete-leader" data-leader-id="${id}">Delete</button></div></article>`;
}
function setupEventHandlers() {
  // HARD BIND - no dataset guard for critical buttons
  if (elements.addButton) { elements.addButton.onclick = (e) => { e.preventDefault(); console.log("Add clicked"); openAddModal(); }; }
  if (elements.emptyAddButton) { elements.emptyAddButton.onclick = (e) => { e.preventDefault(); openAddModal(); }; }
  if (elements.refreshButton) { elements.refreshButton.onclick = async (e) => { e.preventDefault(); await refreshLeaders(); }; }
  if (elements.logoutButton) { elements.logoutButton.onclick = async (e) => { e.preventDefault(); await logoutUser(); }; }
  if (elements.closeModal) { elements.closeModal.onclick = (e) => { e.preventDefault(); closeModal(); }; }
  if (elements.cancelButton) { elements.cancelButton.onclick = (e) => { e.preventDefault(); closeModal(); }; }
  if (elements.modalOverlay) { elements.modalOverlay.onclick = () => closeModal(); }
  if (elements.form) { elements.form.onsubmit = async (e) => { e.preventDefault(); await saveLeader(); }; }
  if (elements.search) { elements.search.oninput = function() { searchLeaders(this.value); }; }
  if (elements.leadersContainer) { elements.leadersContainer.addEventListener("click", handleLeaderContainerClick); }
  document.addEventListener("click", handleGlobalLeaderClick);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
  if (elements.modal) { elements.modal.addEventListener("click", (e) => { if (e.target === elements.modal) closeModal(); }); }
}
async function handleLeaderContainerClick(event) { const b = event.target.closest("[data-action]"); if (!b) return; event.preventDefault(); await handleLeaderAction(b); }
async function handleGlobalLeaderClick(event) {
  const b = event.target.closest("[data-action]");
  if (!b) return;
  const a = b.dataset.action;
  if (!["add-leader","edit-leader","delete-leader","toggle-monitoring"].includes(a)) return;
  if (elements.leadersContainer && elements.leadersContainer.contains(b)) return;
  event.preventDefault(); await handleLeaderAction(b);
}
async function handleLeaderAction(button) {
  const action = button.dataset.action; const leaderId = button.dataset.leaderId;
  if (action === "add-leader") openAddModal();
  if (action === "edit-leader" && leaderId) openEditModal(leaderId);
  if (action === "delete-leader" && leaderId) await deleteLeader(leaderId);
  if (action === "toggle-monitoring" && leaderId) await toggleMonitoring(leaderId);
}
function openAddModal() {
  console.log("Opening Add modal");
  clearForm();
  if (elements.modalTitle) elements.modalTitle.textContent = "Add Leader";
  if (elements.submitButton) elements.submitButton.textContent = "Save Leader";
  if (elements.form) delete elements.form.dataset.editId;
  showModal();
}
function openEditModal(leaderId) {
  const leader = leaders.find(i => String(i.id) === String(leaderId));
  if (!leader) return;
  if (elements.modalTitle) elements.modalTitle.textContent = "Edit Leader";
  if (elements.submitButton) elements.submitButton.textContent = "Update Leader";
  if (elements.form) elements.form.dataset.editId = leader.id;
  if (elements.fullName) elements.fullName.value = leader.full_name || "";
  if (elements.publicName) elements.publicName.value = leader.public_name || "";
  if (elements.position) elements.position.value = leader.position || "";
  if (elements.organization) elements.organization.value = leader.organization || "";
  if (elements.keywords) elements.keywords.value = leader.keywords || "";
  if (elements.nicknames) elements.nicknames.value = leader.nicknames || "";
  if (elements.monitoringEnabled) elements.monitoringEnabled.checked = leader.monitoring_enabled !== false;
  showModal();
}
function closeModal() { if (!elements.modal) return; elements.modal.classList.add("hidden"); elements.modal.classList.remove("open","active","show"); elements.modal.style.display = "none"; }
function showModal() { if (!elements.modal) { console.error("modal not found"); return; } elements.modal.classList.remove("hidden"); elements.modal.classList.add("open","active","show"); elements.modal.style.display = "flex"; setTimeout(() => elements.fullName?.focus(), 50); }
async function saveLeader() {
  const fullName = elements.fullName?.value.trim() || "";
  if (!fullName) { showFormError("Full name required"); return; }
  const payload = { full_name: fullName, public_name: elements.publicName?.value.trim() || "", position: elements.position?.value.trim() || "", organization: elements.organization?.value.trim() || "", keywords: elements.keywords?.value.trim() || "", nicknames: elements.nicknames?.value.trim() || "", monitoring_enabled: elements.monitoringEnabled ? elements.monitoringEnabled.checked : true };
  const editId = elements.form?.dataset.editId;
  const isEditing = Boolean(editId);
  if (elements.submitButton) { elements.submitButton.disabled = true; elements.submitButton.textContent = isEditing ? "Updating..." : "Saving..."; }
  try {
    const url = isEditing ? `/api/leaders/${encodeURIComponent(editId)}` : "/api/leaders";
    const method = isEditing ? "PUT" : "POST";
    const res = await civicLensFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await readJson(res);
    if (!res.ok) throw new Error(result?.detail || "Unable to save");
    closeModal(); await loadLeaders();
  } catch (e) { showFormError(e.message); }
  finally { if (elements.submitButton) { elements.submitButton.disabled = false; elements.submitButton.textContent = isEditing ? "Update Leader" : "Save Leader"; } }
}
async function deleteLeader(id) { if (!confirm("Delete this leader?")) return; try { const r = await civicLensFetch(`/api/leaders/${encodeURIComponent(id)}`, { method: "DELETE" }); if (!r.ok) throw new Error("Delete failed"); await loadLeaders(); } catch (e) { showPageError(e.message); } }
async function toggleMonitoring(id) {
  const leader = leaders.find(i => String(i.id) === String(id)); if (!leader) return;
  const payload = { full_name: leader.full_name, public_name: leader.public_name || "", position: leader.position || "", organization: leader.organization || "", keywords: leader.keywords || "", nicknames: leader.nicknames || "", monitoring_enabled: !leader.monitoring_enabled };
  try { const r = await civicLensFetch(`/api/leaders/${encodeURIComponent(id)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); if (!r.ok) throw new Error("Update failed"); await loadLeaders(); } catch (e) { showPageError(e.message); }
}
function searchLeaders(q) { const n = q.toLowerCase().trim(); if (!n) { renderLeaders(leaders); updateLeaderCount(); return; } const f = leaders.filter(l => [l.full_name,l.public_name,l.position,l.organization,l.keywords,l.nicknames].join(" ").toLowerCase().includes(n)); renderLeaders(f); updateLeaderCount(f.length); }
async function refreshLeaders() { if (elements.refreshButton) elements.refreshButton.textContent = "↻ Refreshing..."; await loadLeaders(); if (elements.refreshButton) elements.refreshButton.textContent = "↻ Refresh"; }
async function logoutUser() { try { await supabaseClient.auth.signOut(); } catch {} window.location.href = "/login"; }
function clearForm() { if (elements.form) { elements.form.reset(); delete elements.form.dataset.editId; } if (elements.monitoringEnabled) elements.monitoringEnabled.checked = true; clearFormError(); }
function clearFormError() { if (elements.formError) { elements.formError.textContent = ""; elements.formError.style.display = "none"; } }
function showFormError(m) { if (!elements.formError) { alert(m); return; } elements.formError.textContent = m; elements.formError.style.display = "block"; }
function showPageError(m) { forceHideLoading(); const el = document.getElementById("leaders-error") || document.getElementById("page-error"); if (el) { el.textContent = m; el.classList.remove("hidden"); el.style.display = "block"; } }
function showLoading() { const l = document.getElementById("leaders-loading"); if (l) { l.classList.remove("hidden"); l.style.display = "flex"; } const e = document.getElementById("leaders-empty"); if (e) e.classList.add("hidden"); }
function hideLoading() { forceHideLoading(); }
function forceHideLoading() {
  const l = document.getElementById("leaders-loading");
  if (l) { l.classList.add("hidden"); l.style.display = "none"; l.style.visibility = "hidden"; }
  // also hide any injected spinner inside container
  const injected = document.querySelector(".leaders-loading");
  if (injected && injected.id !== "leaders-loading") injected.style.display = "none";
}
function updateLeaderCount(c = leaders.length) { if (elements.leaderCount) elements.leaderCount.textContent = c; }
function escapeHtml(v) { return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
function escapeAttribute(v) { return escapeHtml(v); }
window.civicLensLeaders = { loadLeaders, openAddModal, openEditModal, closeModal, deleteLeader, toggleMonitoring, searchLeaders, refreshLeaders, civicLensFetch, forceHideLoading };
console.log("CivicLens: leaders.js file loaded.");