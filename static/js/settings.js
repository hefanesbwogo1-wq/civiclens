"use strict";

document.addEventListener("DOMContentLoaded", initializeSettings);

let supabaseClient = null;
let currentUser = null;
let currentProfile = null;

async function initializeSettings() {
    if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY || !window.supabase) {
        location.href = "/login";
        return;
    }

    supabaseClient = window.supabase.createClient(
        window.SUPABASE_URL,
        window.SUPABASE_ANON_KEY
    );

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        location.href = "/login";
        return;
    }

    await loadUser();
    loadPreferences();
    setupEvents();
}

async function civicLensFetch(url, options = {}) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        location.href = "/login";
        throw new Error("Your session has expired.");
    }

    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${session.access_token}`);
    return fetch(url, { ...options, headers });
}

async function loadUser() {
    try {
        const { data } = await supabaseClient.auth.getUser();
        if (!data?.user) return;

        currentUser = data.user;
        const response = await civicLensFetch("/api/profile");
        const result = await response.json();
        if (!response.ok) throw new Error(result.detail || "Unable to load profile.");

        currentProfile = result.profile;
        const name = currentProfile.full_name || currentUser.email?.split("@")[0] || "CivicLens User";
        const $ = id => document.getElementById(id);

        if ($("user-name")) $("user-name").textContent = name;
        if ($("user-email")) $("user-email").textContent = currentProfile.email || currentUser.email || "";
        if ($("user-avatar")) $("user-avatar").textContent = name.trim().charAt(0).toUpperCase();
        if ($("full-name")) $("full-name").value = currentProfile.full_name || "";
        if ($("email")) $("email").value = currentProfile.email || currentUser.email || "";
        if ($("organization")) $("organization").value = currentProfile.organization || "";
        if ($("phone")) $("phone").value = currentProfile.phone || "";
        if ($("subscription-plan")) $("subscription-plan").textContent = currentProfile.subscription_plan || "basic";
    } catch (error) {
        console.error(error);
        showMessage("Unable to load your profile.", true);
    }
}

function loadPreferences() {
    const preferences = currentProfile?.notification_preferences || {};
    const $ = id => document.getElementById(id);
    if ($("mention-alerts")) $("mention-alerts").checked = Boolean(preferences.mentionAlerts);
    if ($("daily-summary")) $("daily-summary").checked = Boolean(preferences.dailySummary);
    if ($("email-notifications")) $("email-notifications").checked = Boolean(preferences.emailNotifications);
}

function setupEvents() {
    document.getElementById("profile-form")?.addEventListener("submit", saveProfile);
    document.getElementById("save-preferences")?.addEventListener("click", savePreferences);
    document.getElementById("logout-button")?.addEventListener("click", logoutUser);
}

async function updateProfile(data) {
    const response = await civicLensFetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || "Unable to update profile.");
    currentProfile = result.profile;
}

async function saveProfile(event) {
    event.preventDefault();

    try {
        await updateProfile({
            full_name: document.getElementById("full-name")?.value.trim() || "",
            organization: document.getElementById("organization")?.value.trim() || "",
            phone: document.getElementById("phone")?.value.trim() || "",
        });
        showMessage("Profile updated successfully.");
        await loadUser();
    } catch (error) {
        showMessage(error.message, true);
    }
}

async function savePreferences() {
    try {
        await updateProfile({
            notification_preferences: {
                mentionAlerts: document.getElementById("mention-alerts")?.checked || false,
                dailySummary: document.getElementById("daily-summary")?.checked || false,
                emailNotifications: document.getElementById("email-notifications")?.checked || false,
            },
        });
        showMessage("Notification preferences saved.");
    } catch (error) {
        showMessage(error.message, true);
    }
}

function showMessage(message, isError = false) {
    const element = document.getElementById("settings-message");
    if (!element) return;
    element.textContent = message;
    element.style.display = "block";
    element.style.background = isError ? "#fff0f0" : "#eaf8f0";
    element.style.color = isError ? "#b42318" : "#187849";
    setTimeout(() => element.style.display = "none", 3500);
}

async function logoutUser() {
    if (supabaseClient) await supabaseClient.auth.signOut();
    location.href = "/login";
}
