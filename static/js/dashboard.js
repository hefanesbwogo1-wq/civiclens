"use strict";

/*
 * ============================================================
 * CIVICLENS DASHBOARD
 * Authenticated dashboard data loader
 * Collection worker integration
 * ============================================================
 */

let supabaseClient = null;


/* ============================================================
   INITIALIZE SUPABASE
============================================================ */

function initializeSupabase() {

    if (supabaseClient) {
        return supabaseClient;
    }

    if (
        !window.supabase ||
        !window.SUPABASE_URL ||
        !window.SUPABASE_ANON_KEY
    ) {
        console.error(
            "CivicLens: Supabase configuration missing."
        );

        return null;
    }

    try {

        supabaseClient =
            window.supabase.createClient(
                window.SUPABASE_URL,
                window.SUPABASE_ANON_KEY
            );

        console.log(
            "CivicLens: Supabase initialized."
        );

        return supabaseClient;

    } catch (error) {

        console.error(
            "CivicLens: Supabase initialization failed:",
            error
        );

        return null;
    }
}


/* ============================================================
   GET CURRENT SESSION
============================================================ */

async function getCurrentSession() {

    const client =
        initializeSupabase();

    if (!client) {
        throw new Error(
            "Supabase is not configured."
        );
    }

    const {
        data,
        error
    } = await client.auth.getSession();

    if (error) {

        console.error(
            "CivicLens session error:",
            error
        );

        throw new Error(
            "Unable to verify your login session."
        );
    }

    if (
        !data ||
        !data.session ||
        !data.session.access_token
    ) {

        console.warn(
            "CivicLens: No active Supabase session."
        );

        window.location.href =
            "/login";

        return null;
    }

    return data.session;
}


/* ============================================================
   AUTHENTICATED FETCH
============================================================ */

async function civicLensFetch(
    url,
    options = {}
) {

    const session =
        await getCurrentSession();

    if (!session) {
        return null;
    }

    const headers =
        new Headers(
            options.headers || {}
        );

    headers.set(
        "Authorization",
        `Bearer ${session.access_token}`
    );

    headers.set(
        "Accept",
        "application/json"
    );

    if (
        options.body &&
        !headers.has("Content-Type")
    ) {

        headers.set(
            "Content-Type",
            "application/json"
        );
    }

    console.log(
        `CivicLens: Authenticated request → ${url}`
    );

    const response =
        await fetch(
            url,
            {
                ...options,
                headers
            }
        );

    if (response.status === 401) {

        console.warn(
            "CivicLens: API returned 401 Unauthorized."
        );

        const client =
            initializeSupabase();

        if (client) {
            await client.auth.signOut();
        }

        window.location.href =
            "/login";

        return null;
    }

    return response;
}


/* ============================================================
   SAFE JSON
============================================================ */

async function readJson(response) {

    if (!response) {
        return null;
    }

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";

    if (
        !contentType.includes(
            "application/json"
        )
    ) {

        return null;
    }

    try {

        return await response.json();

    } catch (error) {

        console.error(
            "CivicLens JSON parsing error:",
            error
        );

        return null;
    }
}


/* ============================================================
   DOM HELPERS
============================================================ */

function setElementText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


function formatNumber(value) {

    const number =
        Number(value || 0);

    return number.toLocaleString();
}


/* ============================================================
   LOAD LEADERS
============================================================ */

async function loadDashboardLeaders() {

    try {

        const response =
            await civicLensFetch(
                "/api/leaders"
            );

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

        const data =
            await readJson(response);

        if (Array.isArray(data)) {
            return data;
        }

        if (
            data &&
            Array.isArray(data.leaders)
        ) {
            return data.leaders;
        }

        return [];

    } catch (error) {

        console.error(
            "Dashboard leaders error:",
            error
        );

        return [];
    }
}


/* ============================================================
   LOAD MENTION STATS
============================================================ */

async function loadMentionStats() {

    try {

        const response =
            await civicLensFetch(
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

        return (
            await readJson(response)
        ) || {};

    } catch (error) {

        console.error(
            "Mention statistics error:",
            error
        );

        return {};
    }
}


/* ============================================================
   LOAD PLATFORM STATS
============================================================ */

async function loadPlatformStats() {

    try {

        const response =
            await civicLensFetch(
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

        return (
            await readJson(response)
        ) || {};

    } catch (error) {

        console.error(
            "Platform statistics error:",
            error
        );

        return {};
    }
}


/* ============================================================
   EXTRACT TOTAL MENTIONS
============================================================ */

function extractTotalMentions(stats) {

    if (
        !stats ||
        typeof stats !== "object"
    ) {
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


/* ============================================================
   EXTRACT POSITIVE MENTIONS
============================================================ */

function extractPositiveMentions(stats) {

    if (
        !stats ||
        typeof stats !== "object"
    ) {
        return 0;
    }

    return (
        stats.positive_mentions ??
        stats.positive ??
        stats.positive_count ??
        0
    );
}


/* ============================================================
   EXTRACT PLATFORM COUNT
============================================================ */

function extractPlatformCount(stats) {

    if (
        !stats ||
        typeof stats !== "object"
    ) {
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


/* ============================================================
   UPDATE DASHBOARD
============================================================ */

function updateDashboard(
    leaders,
    mentionStats,
    platformStats
) {

    setElementText(
        "total-leaders",
        formatNumber(
            leaders.length
        )
    );

    setElementText(
        "total-mentions",
        formatNumber(
            extractTotalMentions(
                mentionStats
            )
        )
    );

    setElementText(
        "total-platforms",
        formatNumber(
            extractPlatformCount(
                platformStats
            )
        )
    );

    setElementText(
        "positive-mentions",
        formatNumber(
            extractPositiveMentions(
                mentionStats
            )
        )
    );
}


/* ============================================================
   LOAD DASHBOARD
============================================================ */

async function loadDashboard() {

    try {

        const session =
            await getCurrentSession();

        if (!session) {
            return;
        }

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


/* ============================================================
   USER PROFILE
============================================================ */

async function loadDashboardUser() {

    try {

        const client =
            initializeSupabase();

        if (!client) {
            return;
        }

        const {
            data,
            error
        } = await client.auth.getUser();

        if (error) {

            console.error(
                "CivicLens user error:",
                error
            );

            return;
        }

        const user =
            data?.user;

        if (!user) {
            return;
        }

        const emailElements =
            document.querySelectorAll(
                "[data-user-email], #user-email, #profile-email"
            );

        emailElements.forEach(
            element => {

                element.textContent =
                    user.email || "";

            }
        );

        const name =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "CivicLens User";

        const nameElements =
            document.querySelectorAll(
                "[data-user-name], #user-name, #profile-name"
            );

        nameElements.forEach(
            element => {

                element.textContent =
                    name;

            }
        );

        const avatar =
            document.getElementById(
                "user-avatar"
            );

        if (avatar) {

            avatar.textContent =
                name
                    .trim()
                    .charAt(0)
                    .toUpperCase() || "C";

        }

    } catch (error) {

        console.error(
            "Dashboard user error:",
            error
        );
    }
}


/* ============================================================
   COLLECTION STATUS
============================================================ */

function setCollectionStatus(
    message,
    type = "info"
) {

    const element =
        document.getElementById(
            "collection-status"
        );

    if (!element) {

        console.warn(
            "CivicLens: collection-status element not found."
        );

        return;
    }

    element.textContent =
        message;

    element.dataset.status =
        type;
}


/* ============================================================
   RUN COLLECTION
============================================================ */

async function runCollection() {

    console.log(
        "CivicLens: runCollection() started."
    );

    const button =
        document.getElementById(
            "run-collection"
        );

    if (!button) {

        console.error(
            "CivicLens: Run Collection button not found."
        );

        return;
    }

    if (button.disabled) {

        console.warn(
            "CivicLens: Collection already running."
        );

        return;
    }

    const originalText =
        button.textContent;

    button.disabled = true;

    button.textContent =
        "Collecting...";

    setCollectionStatus(
        "Starting mention collection...",
        "loading"
    );

    try {

        console.log(
            "CivicLens: Preparing collection request..."
        );

        const session =
            await getCurrentSession();

        if (!session) {

            console.warn(
                "CivicLens: No active session for collection."
            );

            return;
        }

        console.log(
            "CivicLens: Session verified."
        );

        console.log(
            "CivicLens: Sending POST /api/collector/run"
        );

        const response =
            await civicLensFetch(
                "/api/collector/run",
                {
                    method: "POST",

                    body: JSON.stringify({

                        platforms: [
                            "x",
                            "facebook"
                        ]

                    })
                }
            );

        if (!response) {

            throw new Error(
                "No response received from the CivicLens API."
            );
        }

        console.log(
            "CivicLens: Collection HTTP status:",
            response.status
        );

        const data =
            await readJson(response);

        console.log(
            "CivicLens collection response:",
            data
        );

        if (!response.ok) {

            const message =
                data?.detail ||
                `Collection failed (${response.status}).`;

            throw new Error(
                message
            );
        }

        const result =
            data?.result || {};

        const leaders =
            Number(
                result.leaders || 0
            );

        const platformResults =
            Array.isArray(
                result.platforms
            )
                ? result.platforms
                : [];

        const collected =
            platformResults.reduce(
                (
                    total,
                    platform
                ) => {

                    return total +
                        Number(
                            platform.collected || 0
                        );

                },
                0
            );

        const matched =
            platformResults.reduce(
                (
                    total,
                    platform
                ) => {

                    return total +
                        Number(
                            platform.matched || 0
                        );

                },
                0
            );

        const duplicates =
            platformResults.reduce(
                (
                    total,
                    platform
                ) => {

                    return total +
                        Number(
                            platform.duplicates || 0
                        );

                },
                0
            );

        const errors =
            platformResults.reduce(
                (
                    total,
                    platform
                ) => {

                    return total +
                        Number(
                            platform.errors || 0
                        );

                },
                0
            );

        if (leaders === 0) {

            setCollectionStatus(
                "No monitored leaders found. Add a leader first.",
                "warning"
            );

        } else if (
            collected === 0 &&
            errors === 0
        ) {

            setCollectionStatus(
                "Collection completed. No new public posts were returned by the configured providers.",
                "success"
            );

        } else {

            setCollectionStatus(
                `Collection completed — ${collected} posts checked, ${matched} leader matches found.`,
                "success"
            );
        }

        if (errors > 0) {

            setCollectionStatus(
                `Collection completed with ${errors} provider error(s).`,
                "warning"
            );
        }

        console.log(
            "CivicLens collection summary:",
            {
                leaders,
                collected,
                matched,
                duplicates,
                errors
            }
        );

        await loadDashboard();

    } catch (error) {

        console.error(
            "CivicLens collection error:",
            error
        );

        setCollectionStatus(
            error?.message ||
            "Collection failed.",
            "error"
        );

    } finally {

        button.disabled = false;

        button.textContent =
            originalText;

        console.log(
            "CivicLens: runCollection() finished."
        );
    }
}


/* ============================================================
   LOGOUT
============================================================ */

async function logoutUser() {

    try {

        const client =
            initializeSupabase();

        if (client) {
            await client.auth.signOut();
        }

        window.location.href =
            "/login";

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        window.location.href =
            "/login";
    }
}


/* ============================================================
   NAVIGATION
============================================================ */

function setupDashboardNavigation() {

    console.log(
        "CivicLens: Setting up dashboard navigation..."
    );


    /* --------------------------------------------------------
       LOGOUT
    -------------------------------------------------------- */

    const logoutButtons =
        document.querySelectorAll(
            "#logout-button, #logout-btn, [data-action='logout'], .logout-btn"
        );

    logoutButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                async event => {

                    event.preventDefault();

                    await logoutUser();

                }
            );

        }
    );


    /* --------------------------------------------------------
       RUN COLLECTION
    -------------------------------------------------------- */

    const collectionButton =
        document.getElementById(
            "run-collection"
        );

    if (collectionButton) {

        /*
         * Prevent duplicate binding.
         */

        if (
            collectionButton.dataset.civicLensBound !== "true"
        ) {

            collectionButton.dataset.civicLensBound =
                "true";

            collectionButton.addEventListener(
                "click",
                async event => {

                    event.preventDefault();

                    console.log(
                        "CivicLens: Run Collection CLICK detected."
                    );

                    await runCollection();

                }
            );

            console.log(
                "CivicLens: Run Collection listener attached."
            );

        }

    } else {

        console.error(
            "CivicLens: Run Collection button does not exist in the DOM."
        );
    }


    /* --------------------------------------------------------
       REFRESH
    -------------------------------------------------------- */

    const refreshButton =
        document.getElementById(
            "refresh-dashboard"
        );

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            async event => {

                event.preventDefault();

                console.log(
                    "CivicLens: Dashboard refresh requested."
                );

                await loadDashboard();

            }
        );
    }
}


/* ============================================================
   SUPABASE AUTH STATE LISTENER
============================================================ */

function setupAuthListener() {

    const client =
        initializeSupabase();

    if (!client) {
        return;
    }

    client.auth.onAuthStateChange(
        (
            event,
            session
        ) => {

            console.log(
                "CivicLens auth event:",
                event
            );

            if (
                event === "SIGNED_OUT" ||
                (
                    event === "TOKEN_REFRESHED" &&
                    !session
                )
            ) {

                window.location.href =
                    "/login";

            }

        }
    );
}


/* ============================================================
   START DASHBOARD
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "CivicLens: Dashboard starting..."
        );

        initializeSupabase();

        setupDashboardNavigation();

        setupAuthListener();

        await loadDashboardUser();

        await loadDashboard();

        console.log(
            "CivicLens: Dashboard ready."
        );

    }
);


/* ============================================================
   EXPOSE FUNCTIONS
============================================================ */

window.civicLensDashboard = {

    loadDashboard,

    civicLensFetch,

    logoutUser,

    runCollection

};


/* ============================================================
   GLOBAL CLICK SAFETY NET
   This catches the button even if another dashboard element
   interferes with the normal listener.
============================================================ */

document.addEventListener(
    "click",
    async event => {

        const button =
            event.target.closest(
                "#run-collection"
            );

        if (!button) {
            return;
        }

        /*
         * If the normal listener already handled this click,
         * do not execute collection twice.
         */

        if (
            button.dataset.civicLensClickHandled === "true"
        ) {

            button.dataset.civicLensClickHandled =
                "false";

            return;
        }

        button.dataset.civicLensClickHandled =
            "true";

        console.log(
            "CivicLens: Global Run Collection click detected."
        );

        event.preventDefault();

        await runCollection();

    },
    true
);


/* ============================================================
   SCRIPT LOADED CONFIRMATION
============================================================ */

console.log(
    "CivicLens: dashboard.js loaded successfully."
);