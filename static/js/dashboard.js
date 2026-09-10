document.addEventListener("DOMContentLoaded", async () => {
    console.log("CivicLens Dashboard: initializing...");

    let supabaseClient = null;
    try {
        if (typeof window.supabase !== "undefined" && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
            supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
        }
    } catch (e) { console.error(e); }

    if(!supabaseClient){
        window.location.href = "/login";
        return;
    }

    // AUTH GUARD - THIS WAS MISSING
    const { data: { session } } = await supabaseClient.auth.getSession();
    if(!session){
        console.log("No session -> redirect to login");
        window.location.href = "/login";
        return;
    }

    const userName = document.getElementById("user-name");
    const userEmail = document.getElementById("user-email");
    const userAvatar = document.getElementById("user-avatar");
    const totalMentions = document.getElementById("total-mentions");
    const trackedLeaders = document.getElementById("total-leaders");
    const activePlatforms = document.getElementById("total-platforms");

    // Load user
    try {
        const { data } = await supabaseClient.auth.getUser();
        const user = data?.user;
        if(!user){ window.location.href="/login"; return; }
        const meta = user.user_metadata || {};
        const name = meta.full_name || meta.name || user.email.split("@")[0];
        if(userName) userName.textContent = name;
        if(userEmail) userEmail.textContent = user.email;
        if(userAvatar) userAvatar.textContent = name[0].toUpperCase();
    } catch(e){ window.location.href="/login"; return; }

    // Logout - FIXED SELECTOR
    const logoutBtn = document.getElementById("logout-button") || document.getElementById("logout-btn") || document.querySelector(".logout-button");
    if(logoutBtn){
        logoutBtn.addEventListener("click", async (e)=>{
            e.preventDefault();
            try{ await supabaseClient.auth.signOut(); }catch{}
            localStorage.clear();
            window.location.href = "/login";
        });
    }

    // Stats - safe load
    try{ const r = await fetch("/api/leaders"); if(r.ok){ const d = await r.json(); const arr = Array.isArray(d) ? d : d.leaders || []; if(trackedLeaders) trackedLeaders.textContent = arr.length; } }catch{}
    try{ const r = await fetch("/api/mentions/stats"); if(r.ok){ const d = await r.json(); if(totalMentions) totalMentions.textContent = d.total ?? 0; } }catch{}
    try{ const r = await fetch("/api/platforms/stats"); if(r.ok){ const d = await r.json(); const c = d.count ?? d.active_platforms ?? (d.platforms?.length||0); if(activePlatforms) activePlatforms.textContent = c; } }catch{}

    console.log("CivicLens Dashboard: ready.");
});