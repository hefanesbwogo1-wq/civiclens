"use strict";
document.addEventListener("DOMContentLoaded", async () => {
    if(!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY){ console.error("Supabase missing"); return; }
    const supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    const { data:{ session } } = await supabaseClient.auth.getSession();
    if(!session){ location.href="/login"; return; }
    const modal=document.getElementById("leader-modal"), form=document.getElementById("leader-form"), addButton=document.getElementById("add-leader-button"), closeButton=document.getElementById("close-modal"), cancelButton=document.getElementById("cancel-button"), saveButton=document.getElementById("save-button"), formMessage=document.getElementById("form-message"), searchInput=document.getElementById("search-input"), leadersGrid=document.getElementById("leaders-grid"), leaderCount=document.getElementById("leader-count"), modalTitle=document.getElementById("modal-title"), leaderId=document.getElementById("leader-id"), fullName=document.getElementById("full-name"), publicName=document.getElementById("public-name"), position=document.getElementById("position"), organization=document.getElementById("organization"), keywords=document.getElementById("keywords"), nicknames=document.getElementById("nicknames"), monitoringEnabled=document.getElementById("monitoring-enabled"), logoutButton=document.getElementById("logout-button");
    const user=session.user, metadata=user.user_metadata||{}, name=metadata.full_name||user.email?.split("@")[0]||"CivicLens User";
    const userName=document.getElementById("user-name"), userEmail=document.getElementById("user-email"), avatar=document.getElementById("user-avatar");
    if(userName) userName.textContent=name; if(userEmail) userEmail.textContent=user.email||""; if(avatar) avatar.textContent=name.split(" ").filter(Boolean).slice(0,2).map(w=>w.charAt(0)).join("").toUpperCase()||"C";
    let leaders=[];

    async function apiRequest(url, options={}){
        const { data:{ session: cur } } = await supabaseClient.auth.getSession();
        if(!cur?.access_token){ location.href="/login"; throw new Error("Auth required"); }
        const headers={"Content-Type":"application/json","Authorization":`Bearer ${cur.access_token}`,...(options.headers||{})};
        const response=await fetch(url,{...options, headers});
        const text=await response.text();
        let result;
        try{ result=JSON.parse(text); } catch{ throw new Error(text.slice(0,300) || `HTTP ${response.status}`); }
        if(!response.ok){ throw new Error((result && (result.detail || result.message || result.error)) || text.slice(0,500) || `Request failed: ${response.status}`); }
        return result;
    }

    async function loadLeaders(){
        leadersGrid.innerHTML=`<div class="loading-state"><div class="loading-spinner"></div><p>Loading leaders...</p></div>`;
        try{
            const result=await apiRequest("/api/leaders");
            leaders=result.leaders || result || [];
            if(!Array.isArray(leaders)) leaders=[];
            renderLeaders(leaders);
        }catch(error){
            console.error(error);
            leadersGrid.innerHTML=`<div class="empty-leaders"><h3>Unable to load leaders</h3><p>${escapeHtml(error.message)}</p><button class="primary-button" id="retry-leaders">Try Again</button></div>`;
            document.getElementById("retry-leaders")?.addEventListener("click", loadLeaders);
        }
    }

    function renderLeaders(items){
        if(leaderCount) leaderCount.textContent=items.length;
        if(!items.length){
            leadersGrid.innerHTML=`<div class="empty-leaders"><h3>No leaders yet</h3><p>Add your first leader.</p><button class="primary-button" id="empty-add-button">+ Add Your First Leader</button></div>`;
            document.getElementById("empty-add-button")?.addEventListener("click", openAddModal); return;
        }
        leadersGrid.innerHTML=items.map(l=>`
            <article class="leader-card" data-id="${l.id}">
                <div class="leader-card-top"><div class="leader-main"><div class="leader-avatar">${escapeHtml(getInitials(l.full_name||l.name||""))}</div><div><div class="leader-name">${escapeHtml(l.public_name||l.full_name||l.name||"")}</div>${l.position?`<div class="leader-position">${escapeHtml(l.position)}</div>`:""}${l.organization?`<div class="leader-organization">${escapeHtml(l.organization)}</div>`:""}</div></div><span class="monitoring-badge ${l.monitoring_enabled?"on":"off"}">${l.monitoring_enabled?"MONITORING":"PAUSED"}</span></div>
                <div class="leader-details"><div class="detail-label">KEYWORDS</div><div class="tag-list">${splitTags(l.keywords).length?splitTags(l.keywords).slice(0,6).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join(""):`<span class="no-data">No keywords</span>`}</div><div class="detail-label" style="margin-top:14px;">NICKNAMES</div><div class="tag-list">${splitTags(l.nicknames).length?splitTags(l.nicknames).slice(0,4).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join(""):`<span class="no-data">No nicknames</span>`}</div></div>
                <div class="leader-actions"><button class="card-button edit" data-action="edit" data-id="${l.id}">Edit</button><button class="card-button monitor" data-action="monitor" data-id="${l.id}">${l.monitoring_enabled?"Pause":"Monitor"}</button><button class="card-button delete" data-action="delete" data-id="${l.id}">Delete</button></div>
            </article>`).join("");
        attachCardEvents();
    }

    function attachCardEvents(){
        document.querySelectorAll("[data-action='edit']").forEach(b=>b.addEventListener("click",()=>{ const id=b.dataset.id; const leader=leaders.find(x=>String(x.id)===String(id)); if(leader) openEditModal(leader); }));
        document.querySelectorAll("[data-action='monitor']").forEach(b=>b.addEventListener("click", async()=>{ await toggleMonitoring(b.dataset.id); }));
        document.querySelectorAll("[data-action='delete']").forEach(b=>b.addEventListener("click", async()=>{ await deleteLeader(b.dataset.id); }));
    }

    function openAddModal(){ form?.reset(); if(leaderId) leaderId.value=""; if(monitoringEnabled) monitoringEnabled.checked=true; if(modalTitle) modalTitle.textContent="Add Leader"; if(saveButton) saveButton.textContent="Save Leader"; clearFormMessage(); modal?.classList.remove("hidden"); setTimeout(()=>fullName?.focus(),100); }
    function openEditModal(leader){ if(leaderId) leaderId.value=leader.id; if(fullName) fullName.value=leader.full_name||""; if(publicName) publicName.value=leader.public_name||""; if(position) position.value=leader.position||""; if(organization) organization.value=leader.organization||""; if(keywords) keywords.value=leader.keywords||""; if(nicknames) nicknames.value=leader.nicknames||""; if(monitoringEnabled) monitoringEnabled.checked=Boolean(leader.monitoring_enabled); if(modalTitle) modalTitle.textContent="Edit Leader"; if(saveButton) saveButton.textContent="Update Leader"; clearFormMessage(); modal?.classList.remove("hidden"); }
    function closeModal(){ modal?.classList.add("hidden"); form?.reset(); if(leaderId) leaderId.value=""; clearFormMessage(); }
    addButton?.addEventListener("click", openAddModal); closeButton?.addEventListener("click", closeModal); cancelButton?.addEventListener("click", closeModal); modal?.addEventListener("click", e=>{ if(e.target===modal) closeModal(); });

    form?.addEventListener("submit", async e=>{
        e.preventDefault(); clearFormMessage();
        if(!fullName?.value.trim()){ showFormMessage("Please enter full name","error"); return; }
        if(saveButton){ saveButton.disabled=true; saveButton.textContent=leaderId.value?"Updating...":"Saving..."; }
        const payload={ full_name:fullName.value.trim(), public_name:publicName.value.trim(), position:position.value.trim(), organization:organization.value.trim(), keywords:keywords.value.trim(), nicknames:nicknames.value.trim(), monitoring_enabled:monitoringEnabled.checked };
        try{
            if(leaderId.value){ await apiRequest(`/api/leaders/${leaderId.value}`,{method:"PUT", body:JSON.stringify(payload)}); } else { await apiRequest("/api/leaders",{method:"POST", body:JSON.stringify(payload)}); }
            closeModal(); await loadLeaders();
        }catch(err){ showFormMessage(err.message,"error"); } finally { if(saveButton){ saveButton.disabled=false; saveButton.textContent=leaderId.value?"Update Leader":"Save Leader"; } }
    });

    async function deleteLeader(id){ const leader=leaders.find(x=>String(x.id)===String(id)); if(!leader) return; if(!confirm(`Delete "${leader.full_name||leader.name}"?`)) return; try{ await apiRequest(`/api/leaders/${id}`,{method:"DELETE"}); await loadLeaders(); }catch(e){ alert(e.message); } }
    async function toggleMonitoring(id){ try{ await apiRequest(`/api/leaders/${id}/monitoring`,{method:"PATCH"}); await loadLeaders(); }catch(e){ alert(e.message); } }
    searchInput?.addEventListener("input",()=>{ const q=searchInput.value.trim().toLowerCase(); if(!q){ renderLeaders(leaders); return; } const f=leaders.filter(l=>[l.full_name,l.public_name,l.position,l.organization,l.keywords,l.nicknames].join(" ").toLowerCase().includes(q)); renderLeaders(f); });
    logoutButton?.addEventListener("click", async()=>{ await supabaseClient.auth.signOut(); location.href="/login"; });

    function splitTags(v){ if(!v) return []; return v.split(",").map(x=>x.trim()).filter(Boolean); }
    function getInitials(v){ return (v||"").split(" ").filter(Boolean).slice(0,2).map(w=>w.charAt(0).toUpperCase()).join(""); }
    function escapeHtml(v){ return String(v||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
    function showFormMessage(m,t){ if(!formMessage) return; formMessage.textContent=m; formMessage.className=`form-message show ${t}`; }
    function clearFormMessage(){ if(!formMessage) return; formMessage.textContent=""; formMessage.className="form-message"; }
    await loadLeaders();
});