"use strict";

document.addEventListener(
    "DOMContentLoaded",
    initializeReports
);


let supabaseClient = null;


async function initializeReports() {

    initializeSupabase();

    await loadUser();

    await loadReports();

    setupEvents();

}


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

        const user = data.user;

        const metadata =
            user.user_metadata || {};

        const name =
            metadata.full_name ||
            user.email?.split("@")[0] ||
            "CivicLens User";

        document.getElementById(
            "user-name"
        ).textContent = name;

        document.getElementById(
            "user-email"
        ).textContent = user.email || "";

        document.getElementById(
            "user-avatar"
        ).textContent =
            name.trim().charAt(0).toUpperCase();

    } catch (error) {

        console.error(
            "Reports user error:",
            error
        );

    }
}


async function loadReports() {

    try {

        const summaryResponse =
            await fetch(
                "/api/reports/summary"
            );

        const leadersResponse =
            await fetch(
                "/api/reports/leaders"
            );

        const platformsResponse =
            await fetch(
                "/api/reports/platforms"
            );


        const summary =
            await summaryResponse.json();

        const leaders =
            await leadersResponse.json();

        const platforms =
            await platformsResponse.json();


        if (summary.success) {

            setText(
                "total-mentions",
                summary.total_mentions
            );

            setText(
                "positive-mentions",
                summary.positive
            );

            setText(
                "neutral-mentions",
                summary.neutral
            );

            setText(
                "negative-mentions",
                summary.negative
            );

        }


        renderLeaders(
            leaders.leaders || []
        );

        renderPlatforms(
            platforms.platforms || []
        );

    } catch (error) {

        console.error(
            "Reports loading error:",
            error
        );

    }
}


function renderLeaders(leaders) {

    const container =
        document.getElementById(
            "leader-report"
        );

    if (!leaders.length) {

        container.innerHTML = `
            <div class="report-empty">
                No leader mention data available yet.
            </div>
        `;

        return;
    }


    container.innerHTML =
        leaders.map(item => `

            <div class="report-row">

                <strong>
                    ${escapeHtml(
                        item.leader_name
                    )}
                </strong>

                <span>
                    ${item.mentions}
                </span>

            </div>

        `).join("");
}


function renderPlatforms(platforms) {

    const container =
        document.getElementById(
            "platform-report"
        );

    if (!platforms.length) {

        container.innerHTML = `
            <div class="report-empty">
                No platform mention data available yet.
            </div>
        `;

        return;
    }


    container.innerHTML =
        platforms.map(item => `

            <div class="report-row">

                <strong>
                    ${escapeHtml(
                        item.platform
                    )}
                </strong>

                <span>
                    ${item.mentions}
                </span>

            </div>

        `).join("");
}


function setupEvents() {

    const refresh =
        document.getElementById(
            "refresh-reports"
        );

    refresh.addEventListener(
        "click",
        async () => {

            refresh.disabled = true;

            refresh.textContent =
                "↻ Refreshing...";

            await loadReports();

            refresh.disabled = false;

            refresh.textContent =
                "↻ Refresh";

        }
    );


    const logout =
        document.getElementById(
            "logout-button"
        );

    logout.addEventListener(
        "click",
        logoutUser
    );

}


async function logoutUser() {

    if (supabaseClient) {

        await supabaseClient.auth.signOut();

    }

    window.location.href =
        "/login";
}


function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            value ?? 0;
    }
}


function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}