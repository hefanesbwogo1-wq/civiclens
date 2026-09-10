"use strict";


document.addEventListener(
    "DOMContentLoaded",
    initializePlatforms
);


let supabaseClient = null;


const elements = {};


/* =========================================================
   INITIALIZE
========================================================= */

async function initializePlatforms() {

    cacheElements();

    initializeSupabase();

    await loadUser();

    await loadStatistics();

    await loadPlatforms();

    setupEvents();

}


/* =========================================================
   CACHE
========================================================= */

function cacheElements() {

    elements.userName =
        document.getElementById("user-name");

    elements.userEmail =
        document.getElementById("user-email");

    elements.userAvatar =
        document.getElementById("user-avatar");

    elements.platformList =
        document.getElementById("platform-list");

    elements.activePlatforms =
        document.getElementById("active-platforms");

    elements.totalMentions =
        document.getElementById(
            "total-platform-mentions"
        );

    elements.xMentions =
        document.getElementById("x-mentions");

    elements.facebookMentions =
        document.getElementById(
            "facebook-mentions"
        );

    elements.refresh =
        document.getElementById(
            "refresh-platforms"
        );

    elements.logout =
        document.getElementById(
            "logout-button"
        );

}


/* =========================================================
   SUPABASE
========================================================= */

function initializeSupabase() {

    if (
        !window.supabase ||
        !window.SUPABASE_URL ||
        !window.SUPABASE_ANON_KEY
    ) {

        return;

    }


    supabaseClient =
        window.supabase.createClient(
            window.SUPABASE_URL,
            window.SUPABASE_ANON_KEY
        );

}


/* =========================================================
   USER
========================================================= */

async function loadUser() {

    if (!supabaseClient) {

        return;

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getUser();


        if (error || !data.user) {

            return;

        }


        const user =
            data.user;


        const metadata =
            user.user_metadata || {};


        const name =
            metadata.full_name ||
            user.email?.split("@")[0] ||
            "CivicLens User";


        elements.userName.textContent =
            name;


        elements.userEmail.textContent =
            user.email || "";


        elements.userAvatar.textContent =
            name
                .trim()
                .charAt(0)
                .toUpperCase() || "C";

    }

    catch (error) {

        console.error(
            "CivicLens user error:",
            error
        );

    }

}


/* =========================================================
   STATISTICS
========================================================= */

async function loadStatistics() {

    try {

        const response =
            await fetch(
                "/api/platforms/stats"
            );


        const result =
            await response.json();


        if (!result.success) {

            return;

        }


        elements.activePlatforms.textContent =
            result.active_platforms || 0;


        elements.totalMentions.textContent =
            result.total_mentions || 0;


        elements.xMentions.textContent =
            result.x_mentions || 0;


        elements.facebookMentions.textContent =
            result.facebook_mentions || 0;

    }

    catch (error) {

        console.error(
            "Platform statistics error:",
            error
        );

    }

}


/* =========================================================
   PLATFORMS
========================================================= */

async function loadPlatforms() {

    showLoading();


    try {

        const response =
            await fetch(
                "/api/platforms"
            );


        if (!response.ok) {

            throw new Error(
                "Platform request failed."
            );

        }


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                "Unable to load platforms."
            );

        }


        renderPlatforms(
            result.platforms
        );

    }

    catch (error) {

        console.error(
            "CivicLens platforms error:",
            error
        );


        elements.platformList.innerHTML = `

            <div class="platform-loading">

                <p>
                    Unable to load platforms.
                </p>

            </div>

        `;

    }

}


/* =========================================================
   RENDER
========================================================= */

function renderPlatforms(
    platforms
) {

    if (!platforms.length) {

        elements.platformList.innerHTML = `

            <div class="platform-loading">

                <p>
                    No platforms configured.
                </p>

            </div>

        `;

        return;

    }


    elements.platformList.innerHTML =
        platforms
            .map(
                createPlatform
            )
            .join("");

}


/* =========================================================
   PLATFORM CARD
========================================================= */

function createPlatform(
    platform
) {

    const available =
        platform.status === "available";


    const statusBadge =
        available

            ? `
                <span class="monitoring-badge">
                    ● MONITORING READY
                </span>
            `

            : `
                <span class="coming-badge">
                    COMING SOON
                </span>
            `;


    const action =
        available

            ? `
                <button
                    class="platform-action"
                    type="button"
                    data-platform="${escapeHtml(platform.id)}"
                >
                    Configure
                </button>
            `

            : `
                <button
                    class="platform-action disabled"
                    type="button"
                    disabled
                >
                    Coming Soon
                </button>
            `;


    return `

        <div class="platform-item">

            <div class="platform-icon">
                ${escapeHtml(platform.icon)}
            </div>


            <div class="platform-details">

                <h4>
                    ${escapeHtml(platform.name)}
                </h4>

                <p>
                    ${escapeHtml(platform.description)}
                </p>


                <div class="platform-meta">

                    ${statusBadge}

                    <span class="platform-count">
                        ${platform.mention_count || 0}
                        mentions
                    </span>

                </div>

            </div>


            ${action}

        </div>

    `;

}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    elements.refresh.addEventListener(
        "click",
        async function () {

            elements.refresh.disabled =
                true;

            elements.refresh.textContent =
                "↻ Refreshing...";


            await loadStatistics();

            await loadPlatforms();


            elements.refresh.disabled =
                false;

            elements.refresh.textContent =
                "↻ Refresh";

        }
    );


    if (elements.logout) {

        elements.logout.addEventListener(
            "click",
            logoutUser
        );

    }

}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutUser() {

    if (supabaseClient) {

        try {

            await supabaseClient.auth.signOut();

        }

        catch (error) {

            console.error(error);

        }

    }


    window.location.href =
        "/login";

}


/* =========================================================
   LOADING
========================================================= */

function showLoading() {

    elements.platformList.innerHTML = `

        <div class="platform-loading">

            <div class="platform-spinner"></div>

            <p>
                Loading platforms...
            </p>

        </div>

    `;

}


/* =========================================================
   ESCAPE
========================================================= */

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}