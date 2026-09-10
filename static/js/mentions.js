"use strict";


/* =========================================================
   CIVICLENS MENTIONS
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeMentions
);


let supabaseClient = null;


const elements = {};


/* =========================================================
   INITIALIZE
========================================================= */

async function initializeMentions() {

    cacheElements();

    initializeSupabase();

    if (!supabaseClient) {

        showError(
            "CivicLens configuration is unavailable."
        );

        return;
    }


    const authenticated = await verifySession();

    if (!authenticated) {
        return;
    }


    await loadUser();

    await loadStats();

    await loadLeaders();

    await loadMentions();

    setupEvents();
}


/* =========================================================
   CACHE ELEMENTS
========================================================= */

function cacheElements() {

    elements.userName =
        document.getElementById("user-name");

    elements.userEmail =
        document.getElementById("user-email");

    elements.userAvatar =
        document.getElementById("user-avatar");

    elements.search =
        document.getElementById("search-input");

    elements.leader =
        document.getElementById("leader-filter");

    elements.platform =
        document.getElementById("platform-filter");

    elements.sentiment =
        document.getElementById("sentiment-filter");

    elements.clear =
        document.getElementById("clear-filters");

    elements.refresh =
        document.getElementById("refresh-button");

    elements.container =
        document.getElementById("mentions-container");

    elements.count =
        document.getElementById("mention-count");

    elements.statTotal =
        document.getElementById("stat-total");

    elements.statPositive =
        document.getElementById("stat-positive");

    elements.statNeutral =
        document.getElementById("stat-neutral");

    elements.statNegative =
        document.getElementById("stat-negative");

    elements.logout =
        document.getElementById("logout-button");
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

        console.warn(
            "CivicLens: Supabase configuration unavailable."
        );

        return;
    }


    supabaseClient =
        window.supabase.createClient(
            window.SUPABASE_URL,
            window.SUPABASE_ANON_KEY
        );
}


/* =========================================================
   VERIFY SESSION
========================================================= */

async function verifySession() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();


        if (
            error ||
            !data.session
        ) {

            window.location.href =
                "/login";

            return false;
        }


        return true;

    }
    catch (error) {

        console.error(
            "CivicLens session error:",
            error
        );

        window.location.href =
            "/login";

        return false;
    }
}


/* =========================================================
   AUTHENTICATED API REQUEST
========================================================= */

async function civicLensFetch(
    url,
    options = {}
) {

    const {
        data,
        error
    } =
        await supabaseClient.auth.getSession();


    if (
        error ||
        !data.session
    ) {

        window.location.href =
            "/login";

        throw new Error(
            "Authentication session expired."
        );
    }


    const headers = new Headers(
        options.headers || {}
    );


    headers.set(
        "Authorization",
        `Bearer ${data.session.access_token}`
    );


    headers.set(
        "Accept",
        "application/json"
    );


    return fetch(
        url,
        {
            ...options,
            headers
        }
    );
}


/* =========================================================
   LOAD USER
========================================================= */

async function loadUser() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getUser();


        if (
            error ||
            !data.user
        ) {
            return;
        }


        const user = data.user;


        const metadata =
            user.user_metadata || {};


        const name =
            metadata.full_name ||
            user.email?.split("@")[0] ||
            "CivicLens User";


        if (elements.userName) {

            elements.userName.textContent =
                name;
        }


        if (elements.userEmail) {

            elements.userEmail.textContent =
                user.email || "";
        }


        if (elements.userAvatar) {

            elements.userAvatar.textContent =
                name
                    .trim()
                    .charAt(0)
                    .toUpperCase() ||
                "C";
        }

    }
    catch (error) {

        console.error(
            "CivicLens user error:",
            error
        );
    }
}


/* =========================================================
   LOAD STATS
========================================================= */

async function loadStats() {

    try {

        const response =
            await civicLensFetch(
                "/api/mentions/stats"
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load mention statistics."
            );
        }


        const result =
            await response.json();


        if (!result.success) {
            return;
        }


        elements.statTotal.textContent =
            result.total || 0;


        elements.statPositive.textContent =
            result.positive || 0;


        elements.statNeutral.textContent =
            result.neutral || 0;


        elements.statNegative.textContent =
            result.negative || 0;

    }
    catch (error) {

        console.error(
            "CivicLens statistics error:",
            error
        );
    }
}


/* =========================================================
   LOAD LEADERS
========================================================= */

async function loadLeaders() {

    try {

        const response =
            await civicLensFetch(
                "/api/mentions/leaders"
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load leaders."
            );
        }


        const result =
            await response.json();


        if (!result.success) {
            return;
        }


        const currentValue =
            elements.leader.value;


        elements.leader.innerHTML = `
            <option value="">
                All Leaders
            </option>
        `;


        for (
            const leader of result.leaders || []
        ) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                leader;


            option.textContent =
                leader;


            elements.leader.appendChild(
                option
            );
        }


        if (
            result.leaders.includes(
                currentValue
            )
        ) {

            elements.leader.value =
                currentValue;
        }

    }
    catch (error) {

        console.error(
            "CivicLens leader filter error:",
            error
        );
    }
}


/* =========================================================
   LOAD MENTIONS
========================================================= */

async function loadMentions() {

    showLoading();


    try {

        const params =
            new URLSearchParams();


        const search =
            elements.search.value.trim();


        const leader =
            elements.leader.value;


        const platform =
            elements.platform.value;


        const sentiment =
            elements.sentiment.value;


        if (search) {

            params.set(
                "search",
                search
            );
        }


        if (leader) {

            params.set(
                "leader",
                leader
            );
        }


        if (platform) {

            params.set(
                "platform",
                platform
            );
        }


        if (sentiment) {

            params.set(
                "sentiment",
                sentiment
            );
        }


        const query =
            params.toString();


        const url =
            query
                ? `/api/mentions?${query}`
                : "/api/mentions";


        const response =
            await civicLensFetch(
                url
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load mentions."
            );
        }


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.message ||
                "Unable to load mentions."
            );
        }


        renderMentions(
            result.mentions || []
        );

    }
    catch (error) {

        console.error(
            "CivicLens mentions error:",
            error
        );


        showError(
            "Unable to load mentions. Please refresh and try again."
        );
    }
}


/* =========================================================
   RENDER MENTIONS
========================================================= */

function renderMentions(
    mentions
) {

    elements.count.textContent =
        `${mentions.length} ${
            mentions.length === 1
                ? "mention"
                : "mentions"
        }`;


    if (!mentions.length) {

        elements.container.innerHTML = `

            <div class="mentions-empty">

                <div class="empty-mention-icon">
                    ◉
                </div>

                <h4>
                    No mentions found
                </h4>

                <p>
                    CivicLens has not collected any public
                    mentions matching your current filters.
                    Once monitoring begins, conversations
                    mentioning your tracked leaders will
                    appear here.
                </p>

            </div>

        `;

        return;
    }


    elements.container.innerHTML =
        mentions
            .map(
                createMentionCard
            )
            .join("");
}


/* =========================================================
   CREATE MENTION CARD
========================================================= */

function createMentionCard(
    mention
) {

    const author =
        mention.author_name ||
        "Public User";


    const handle =
        mention.author_handle ||
        "";


    const leader =
        mention.leader_name ||
        "Tracked leader";


    const platform =
        mention.platform ||
        "Unknown";


    let sentiment =
        String(
            mention.sentiment ||
            "neutral"
        ).toLowerCase();


    const allowedSentiments = [
        "positive",
        "neutral",
        "negative"
    ];


    if (
        !allowedSentiments.includes(
            sentiment
        )
    ) {

        sentiment = "neutral";
    }


    const content =
        escapeHtml(
            mention.content || ""
        );


    const avatar =
        escapeHtml(
            author
                .trim()
                .charAt(0)
                .toUpperCase() ||
            "P"
        );


    const authorSafe =
        escapeHtml(author);


    const handleSafe =
        escapeHtml(handle);


    const leaderSafe =
        escapeHtml(leader);


    const platformSafe =
        escapeHtml(platform);


    const date =
        formatDate(
            mention.published_at ||
            mention.created_at
        );


    const postLink =
        isValidHttpUrl(
            mention.post_url
        )
            ? `

                <a
                    class="view-post"
                    href="${escapeAttribute(
                        mention.post_url
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    View Original Post →
                </a>

            `
            : "";


    return `

        <article class="mention-card">

            <div class="mention-top">

                <div class="mention-author">

                    <div class="author-avatar">
                        ${avatar}
                    </div>

                    <div>

                        <span class="author-name">
                            ${authorSafe}
                        </span>

                        <span class="author-handle">
                            ${handleSafe}
                        </span>

                    </div>

                </div>


                <div class="mention-meta">

                    <span class="platform-badge">
                        ${platformSafe}
                    </span>

                    <span
                        class="sentiment-badge ${sentiment}"
                    >
                        ${capitalize(sentiment)}
                    </span>

                </div>

            </div>


            <p class="mention-content">
                ${content}
            </p>


            <div class="mention-bottom">

                <span class="mention-leader">

                    Mentioning:

                    <strong>
                        ${leaderSafe}
                    </strong>

                    · ${escapeHtml(date)}

                </span>


                ${postLink}

            </div>

        </article>

    `;
}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    let searchTimer;


    elements.search.addEventListener(
        "input",
        function () {

            clearTimeout(
                searchTimer
            );


            searchTimer =
                setTimeout(
                    loadMentions,
                    350
                );
        }
    );


    elements.leader.addEventListener(
        "change",
        loadMentions
    );


    elements.platform.addEventListener(
        "change",
        loadMentions
    );


    elements.sentiment.addEventListener(
        "change",
        loadMentions
    );


    elements.clear.addEventListener(
        "click",
        function () {

            elements.search.value =
                "";

            elements.leader.value =
                "";

            elements.platform.value =
                "";

            elements.sentiment.value =
                "";

            loadMentions();
        }
    );


    elements.refresh.addEventListener(
        "click",
        refreshMentions
    );


    if (elements.logout) {

        elements.logout.addEventListener(
            "click",
            logoutUser
        );
    }
}


/* =========================================================
   REFRESH
========================================================= */

async function refreshMentions() {

    elements.refresh.disabled =
        true;


    elements.refresh.textContent =
        "↻ Refreshing...";


    try {

        await loadStats();

        await loadLeaders();

        await loadMentions();

    }
    finally {

        elements.refresh.disabled =
            false;

        elements.refresh.textContent =
            "↻ Refresh";
    }
}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutUser() {

    try {

        if (supabaseClient) {

            await supabaseClient.auth.signOut();
        }

    }
    catch (error) {

        console.error(
            "CivicLens logout error:",
            error
        );

    }


    window.location.href =
        "/login";
}


/* =========================================================
   LOADING
========================================================= */

function showLoading() {

    elements.container.innerHTML = `

        <div class="mentions-loading">

            <div class="loading-spinner"></div>

            <p>
                Loading mentions...
            </p>

        </div>

    `;
}


/* =========================================================
   ERROR
========================================================= */

function showError(
    message
) {

    elements.container.innerHTML = `

        <div class="mentions-error">
            ${escapeHtml(message)}
        </div>

    `;
}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(
    value
) {

    if (!value) {

        return "Date unavailable";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);
    }


    return date.toLocaleString(
        undefined,
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}


/* =========================================================
   CAPITALIZE
========================================================= */

function capitalize(
    value
) {

    if (!value) {
        return "";
    }


    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );
}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(
    value
) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   ATTRIBUTE ESCAPE
========================================================= */

function escapeAttribute(
    value
) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        );
}


/* =========================================================
   VALIDATE POST URL
========================================================= */

function isValidHttpUrl(
    value
) {

    if (!value) {
        return false;
    }


    try {

        const url =
            new URL(value);


        return (
            url.protocol === "http:" ||
            url.protocol === "https:"
        );

    }
    catch {

        return false;
    }
}