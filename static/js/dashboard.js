"use strict";

/*
 * ============================================================
 * CIVICLENS DASHBOARD
 * Authenticated dashboard data loader
 * ============================================================
 */

let supabaseClient = null;

/* ------------------------------------------------------------
   INITIALIZE SUPABASE
------------------------------------------------------------ */

function initializeSupabase() {
    if (supabaseClient) {
        return supabaseClient;
    }

    if (
        !window.supabase ||
        !window.SUPABASE_URL ||
        !window.SUPABASE_ANON_KEY
    ) {
        console.error("CivicLens: Supabase configuration missing.");
        return null;
    }

    supabaseClient = window.supabase.createClient(
        window.SUPABASE_URL,
        window.SUPABASE_ANON_KEY
    );

    return supabaseClient;
}

/* ------------------------------------------------------------
   AUTHENTICATED FETCH
------------------------------------------------------------ */

async function civicLensFetch(url, options = {}) {
    const client = initializeSupabase();

    if (!client) {
        throw new Error("Supabase is not configured.");
    }

    const {
        data: { session },
        error
    } = await client.auth.getSession();

    if (error) {
        console.error("Session error:", error);
        throw new Error("Unable to verify your session.");
    }

    if (!session || !session.access_token) {
        window.location.href = "/login";
        return;
    }

    const headers = new Headers(options.headers || {});

    headers.set(
        "Authorization",
        `Bearer ${session.access_token}`
    );

    headers.set("Accept", "application/json");

    if (
        options.body &&
        !headers.has("Content-Type")
    ) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (response.status === 401) {
        console.warn("CivicLens: Authentication expired.");
        await client.auth.signOut();
        window.location.href = "/login";
        return;
    }

    return response;
}

/* ------------------------------------------------------------
   SAFE JSON
------------------------------------------------------------ */

async function readJson(response) {
    if (!response) {
        return null;
    }

    const contentType =
        response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
        return null;
    }

    try {
        return await response.json();
    } catch (error) {
        console.error("JSON parsing error:", error);
        return null;
    }
}

/* ------------------------------------------------------------
   DOM HELPERS
------------------------------------------------------------ */

function setElementText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function formatNumber(value) {
    const number = Number(value || 0);

    return number.toLocaleString();
}

/* ------------------------------------------------------------
   LOAD LEADERS
------------------------------------------------------------ */

async function loadDashboardLeaders() {
    try {
        const response = await civicLensFetch("/api/leaders");

        if (!response) {
            return [];
        }

        if (!response.ok) {
            console.error(
                "Failed to load leaders:",
                response.status
            );

            return [];
        }

        const data = await readJson(response);

        if (Array.isArray(data)) {
            return data;
        }

        if (data && Array.isArray(data.leaders)) {
            return data.leaders;
        }

        return [];
    } catch (error) {
        console.error("Dashboard leaders error:", error);
        return [];
    }
}

/* ------------------------------------------------------------
   LOAD MENTION STATS
------------------------------------------------------------ */

async function loadMentionStats() {
    try {
        const response = await civicLensFetch(
            "/api/mentions/stats"
        );

        if (!response) {
            return {};
        }

        if (!response.ok) {
            console.error(
                "Failed to load mention statistics:",
                response.status
            );

            return {};
        }

        return (await readJson(response)) || {};
    } catch (error) {
        console.error("Mention statistics error:", error);
        return {};
    }
}

/* ------------------------------------------------------------
   LOAD PLATFORM STATS
------------------------------------------------------------ */

async function loadPlatformStats() {
    try {
        const response = await civicLensFetch(
            "/api/platforms/stats"
        );

        if (!response) {
            return {};
        }

        if (!response.ok) {
            console.error(
                "Failed to load platform statistics:",
                response.status
            );

            return {};
        }

        return (await readJson(response)) || {};
    } catch (error) {
        console.error("Platform statistics error:", error);
        return {};
    }
}

/* ------------------------------------------------------------
   EXTRACT TOTAL MENTIONS
------------------------------------------------------------ */

function extractTotalMentions(stats) {
    if (!stats || typeof stats !== "object") {
        return 0;
    }

    return (
        stats.total_mentions ??
        stats.total ??
        stats.count ??
        stats.mentions ??
        0
    );
}

/* ------------------------------------------------------------
   EXTRACT POSITIVE MENTIONS
------------------------------------------------------------ */

function extractPositiveMentions(stats) {
    if (!stats || typeof stats !== "object") {
        return 0;
    }

    return (
        stats.positive_mentions ??
        stats.positive ??
        stats.positive_count ??
        0
    );
}

/* ------------------------------------------------------------
   EXTRACT PLATFORM COUNT
------------------------------------------------------------ */

function extractPlatformCount(stats) {
    if (!stats || typeof stats !== "object") {
        return 0;
    }

    if (Array.isArray(stats)) {
        return stats.length;
    }

    return (
        stats.total_platforms ??
        stats.active_platforms ??
        stats.platforms_count ??
        stats.count ??
        0
    );
}

/* ------------------------------------------------------------
   UPDATE DASHBOARD
------------------------------------------------------------ */

function updateDashboard(
    leaders,
    mentionStats,
    platformStats
) {
    /*
     * Total leaders
     */

    setElementText(
        "total-leaders",
        formatNumber(leaders.length)
    );

    /*
     * Total mentions
     */

    setElementText(
        "total-mentions",
        formatNumber(
            extractTotalMentions(mentionStats)
        )
    );

    /*
     * Platforms
     */

    let platformCount =
        extractPlatformCount(platformStats);

    /*
     * If backend returns an array or does not provide
     * a count, use the number of tracked platforms.
     */

    if (
        !platformCount &&
        Array.isArray(platformStats)
    ) {
        platformCount = platformStats.length;
    }

    setElementText(
        "total-platforms",
        formatNumber(platformCount)
    );

    /*
     * Positive mentions
     */

    setElementText(
        "positive-mentions",
        formatNumber(
            extractPositiveMentions(mentionStats)
        )
    );
}

/* ------------------------------------------------------------
   LOAD DASHBOARD
------------------------------------------------------------ */

async function loadDashboard() {
    try {
        const client = initializeSupabase();

        if (!client) {
            return;
        }

        const {
            data: { session }
        } = await client.auth.getSession();

        if (!session) {
            window.location.href = "/login";
            return;
        }

        /*
         * Load all dashboard information.
         */

        const [
            leaders,
            mentionStats,
            platformStats
        ] = await Promise.all([
            loadDashboardLeaders(),
            loadMentionStats(),
            loadPlatformStats()
        ]);

        updateDashboard(
            leaders,
            mentionStats,
            platformStats
        );

    } catch (error) {
        console.error(
            "CivicLens dashboard error:",
            error
        );
    }
}

/* ------------------------------------------------------------
   USER PROFILE
------------------------------------------------------------ */

async function loadDashboardUser() {
    try {
        const client = initializeSupabase();

        if (!client) {
            return;
        }

        const {
            data: { user }
        } = await client.auth.getUser();

        if (!user) {
            return;
        }

        const emailElements = document.querySelectorAll(
            "[data-user-email], #user-email, #profile-email"
        );

        emailElements.forEach(element => {
            element.textContent = user.email || "";
        });

        const name =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "CivicLens User";

        const nameElements = document.querySelectorAll(
            "[data-user-name], #user-name, #profile-name"
        );

        nameElements.forEach(element => {
            element.textContent = name;
        });

    } catch (error) {
        console.error(
            "Dashboard user error:",
            error
        );
    }
}

/* ------------------------------------------------------------
   LOGOUT
------------------------------------------------------------ */

async function logoutUser() {
    try {
        const client = initializeSupabase();

        if (client) {
            await client.auth.signOut();
        }

        window.location.href = "/login";

    } catch (error) {
        console.error("Logout error:", error);
        window.location.href = "/login";
    }
}

/* ------------------------------------------------------------
   NAVIGATION
------------------------------------------------------------ */

function setupDashboardNavigation() {
    const logoutButtons = document.querySelectorAll(
        "#logout-btn, [data-action='logout'], .logout-btn"
    );

    logoutButtons.forEach(button => {
        button.addEventListener("click", async event => {
            event.preventDefault();
            await logoutUser();
        });
    });
}

/* ------------------------------------------------------------
   START DASHBOARD
------------------------------------------------------------ */

document.addEventListener("DOMContentLoaded", async () => {
    initializeSupabase();

    setupDashboardNavigation();

    await loadDashboardUser();

    await loadDashboard();
});

/* ------------------------------------------------------------
   EXPOSE FUNCTIONS
------------------------------------------------------------ */

window.civicLensDashboard = {
    loadDashboard,
    civicLensFetch,
    logoutUser
};