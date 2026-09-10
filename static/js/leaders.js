"use strict";

/*
 * ============================================================
 * CIVICLENS LEADERS MANAGEMENT
 * Authenticated CRUD
 * ============================================================
 */

let supabaseClient = null;
let leaders = [];
let editingLeaderId = null;

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
            "CivicLens: Supabase configuration unavailable."
        );

        showError(
            "Supabase configuration is unavailable."
        );

        return null;
    }

    supabaseClient = window.supabase.createClient(
        window.SUPABASE_URL,
        window.SUPABASE_ANON_KEY
    );

    return supabaseClient;
}

/* ============================================================
   AUTHENTICATED FETCH
============================================================ */

async function civicLensFetch(
    url,
    options = {}
) {

    const client = initializeSupabase();

    if (!client) {
        throw new Error(
            "Supabase is not configured."
        );
    }

    const {
        data: { session },
        error
    } = await client.auth.getSession();

    if (error) {
        console.error(
            "Session error:",
            error
        );

        throw new Error(
            "Unable to verify your login session."
        );
    }

    if (
        !session ||
        !session.access_token
    ) {
        window.location.href = "/login";
        return null;
    }

    const headers = new Headers(
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

    const response = await fetch(
        url,
        {
            ...options,
            headers
        }
    );

    if (response.status === 401) {

        console.warn(
            "CivicLens: Session expired."
        );

        await client.auth.signOut();

        window.location.href = "/login";

        return null;
    }

    return response;
}

/* ============================================================
   DOM HELPERS
============================================================ */

function getElement(id) {
    return document.getElementById(id);
}

function showElement(id) {
    const element = getElement(id);

    if (element) {
        element.classList.remove("hidden");
    }
}

function hideElement(id) {
    const element = getElement(id);

    if (element) {
        element.classList.add("hidden");
    }
}

/* ============================================================
   MESSAGES
============================================================ */

let messageTimer = null;

function showSuccess(message) {

    const element =
        getElement("leaders-success");

    if (!element) {
        return;
    }

    element.textContent = message;

    element.classList.remove(
        "hidden"
    );

    hideElement("leaders-error");

    clearTimeout(messageTimer);

    messageTimer = setTimeout(() => {
        hideElement("leaders-success");
    }, 4500);
}

function showError(message) {

    const element =
        getElement("leaders-error");

    if (!element) {
        return;
    }

    element.textContent = message;

    element.classList.remove(
        "hidden"
    );

    hideElement("leaders-success");
}

/* ============================================================
   INITIAL SESSION
============================================================ */

async function verifySession() {

    const client =
        initializeSupabase();

    if (!client) {
        return false;
    }

    const {
        data: { session },
        error
    } = await client.auth.getSession();

    if (error) {

        console.error(
            "Session verification error:",
            error
        );

        window.location.href =
            "/login";

        return false;
    }

    if (
        !session ||
        !session.access_token
    ) {
        window.location.href =
            "/login";

        return false;
    }

    return true;
}

/* ============================================================
   LOAD USER
============================================================ */

async function loadUserProfile() {

    try {

        const client =
            initializeSupabase();

        if (!client) {
            return;
        }

        const {
            data: { user }
        } = await client.auth.getUser();

        if (!user) {
            return;
        }

        const name =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "CivicLens User";

        const nameElement =
            getElement("user-name");

        const emailElement =
            getElement("user-email");

        if (nameElement) {
            nameElement.textContent =
                name;
        }

        if (emailElement) {
            emailElement.textContent =
                user.email || "";
        }

    } catch (error) {

        console.error(
            "User profile error:",
            error
        );
    }
}

/* ============================================================
   LOAD LEADERS
============================================================ */

async function loadLeaders() {

    showElement(
        "leaders-loading"
    );

    hideElement(
        "leaders-empty"
    );

    hideElement(
        "leaders-error"
    );

    const grid =
        getElement("leaders-grid");

    if (grid) {
        grid.innerHTML = "";
    }

    try {

        const response =
            await civicLensFetch(
                "/api/leaders"
            );

        if (!response) {
            return;
        }

        if (!response.ok) {

            let message =
                `Unable to load leaders (${response.status}).`;

            try {

                const errorData =
                    await response.json();

                if (errorData?.detail) {
                    message =
                        errorData.detail;
                }

            } catch (_) {
                // Ignore JSON parsing failure.
            }

            throw new Error(
                message
            );
        }

        const data =
            await response.json();

        if (Array.isArray(data)) {

            leaders = data;

        } else if (
            data &&
            Array.isArray(data.leaders)
        ) {

            leaders =
                data.leaders;

        } else {

            leaders = [];
        }

        renderLeaders(
            leaders
        );

    } catch (error) {

        console.error(
            "Load leaders error:",
            error
        );

        showError(
            error.message ||
            "Unable to load leaders."
        );

    } finally {

        hideElement(
            "leaders-loading"
        );
    }
}

/* ============================================================
   RENDER LEADERS
============================================================ */

function renderLeaders(
    leaderList
) {

    const grid =
        getElement("leaders-grid");

    const empty =
        getElement("leaders-empty");

    if (!grid) {
        return;
    }

    grid.innerHTML = "";

    if (
        !leaderList ||
        leaderList.length === 0
    ) {

        if (empty) {
            empty.classList.remove(
                "hidden"
            );
        }

        return;
    }

    if (empty) {
        empty.classList.add(
            "hidden"
        );
    }

    leaderList.forEach(
        leader => {

            grid.appendChild(
                createLeaderCard(
                    leader
                )
            );
        }
    );
}

/* ============================================================
   CREATE LEADER CARD
============================================================ */

function createLeaderCard(
    leader
) {

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "leader-card";

    const name =
        leader.full_name ||
        "Unnamed Leader";

    const publicName =
        leader.public_name ||
        "";

    const position =
        leader.position ||
        "Position not specified";

    const organization =
        leader.organization ||
        "Organization not specified";

    const monitoring =
        leader.monitoring_enabled !== false;

    const initials =
        getInitials(name);

    const keywords =
        parseList(
            leader.keywords
        );

    const nicknames =
        parseList(
            leader.nicknames
        );

    const tags = [
        ...keywords,
        ...nicknames
    ].slice(0, 6);

    const tagHTML =
        tags.length
            ? `
                <div class="leader-tags">
                    ${tags.map(
                        tag =>
                            `
                            <span class="leader-tag">
                                ${escapeHTML(tag)}
                            </span>
                            `
                    ).join("")}
                </div>
            `
            : "";

    card.innerHTML = `
        <div class="leader-card-header">

            <div class="leader-avatar">
                ${escapeHTML(initials)}
            </div>

            <div class="leader-info">

                <h3>
                    ${escapeHTML(name)}
                </h3>

                ${
                    publicName
                        ? `
                            <div class="leader-public-name">
                                ${escapeHTML(publicName)}
                            </div>
                        `
                        : ""
                }

            </div>

            <span
                class="leader-status ${
                    monitoring
                        ? "active"
                        : "inactive"
                }"
            >
                ${
                    monitoring
                        ? "Monitoring"
                        : "Paused"
                }
            </span>

        </div>

        <div class="leader-details">

            <div class="detail-row">

                <span class="detail-label">
                    Position
                </span>

                <span class="detail-value">
                    ${escapeHTML(position)}
                </span>

            </div>

            <div class="detail-row">

                <span class="detail-label">
                    Organization
                </span>

                <span class="detail-value">
                    ${escapeHTML(organization)}
                </span>

            </div>

        </div>

        ${tagHTML}

        <div class="leader-actions">

            <button
                type="button"
                class="action-btn edit"
                data-action="edit"
                data-id="${escapeHTML(
                    String(leader.id)
                )}"
            >
                Edit
            </button>

            <button
                type="button"
                class="action-btn"
                data-action="toggle"
                data-id="${escapeHTML(
                    String(leader.id)
                )}"
            >
                ${
                    monitoring
                        ? "Pause"
                        : "Enable"
                }
            </button>

            <button
                type="button"
                class="action-btn delete"
                data-action="delete"
                data-id="${escapeHTML(
                    String(leader.id)
                )}"
            >
                Delete
            </button>

        </div>
    `;

    return card;
}

/* ============================================================
   INITIALS
============================================================ */

function getInitials(
    name
) {

    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(
            part =>
                part.charAt(0)
                    .toUpperCase()
        )
        .join("");
}

/* ============================================================
   PARSE LIST
============================================================ */

function parseList(value) {

    if (!value) {
        return [];
    }

    if (Array.isArray(value)) {
        return value;
    }

    return String(value)
        .split(",")
        .map(
            item => item.trim()
        )
        .filter(Boolean);
}

/* ============================================================
   ESCAPE HTML
============================================================ */

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value ?? "";

    return div.innerHTML;
}

/* ============================================================
   OPEN ADD MODAL
============================================================ */

function openAddModal() {

    editingLeaderId = null;

    const title =
        getElement("modal-title");

    const saveButton =
        getElement(
            "save-leader-btn"
        );

    if (title) {
        title.textContent =
            "Add Leader";
    }

    if (saveButton) {
        saveButton.textContent =
            "Save Leader";
    }

    resetLeaderForm();

    openModal();
}

/* ============================================================
   OPEN EDIT MODAL
============================================================ */

function openEditModal(
    leaderId
) {

    const leader =
        leaders.find(
            item =>
                String(item.id) ===
                String(leaderId)
        );

    if (!leader) {
        showError(
            "Leader could not be found."
        );

        return;
    }

    editingLeaderId =
        leader.id;

    const title =
        getElement("modal-title");

    const saveButton =
        getElement(
            "save-leader-btn"
        );

    if (title) {
        title.textContent =
            "Edit Leader";
    }

    if (saveButton) {
        saveButton.textContent =
            "Update Leader";
    }

    setValue(
        "leader-id",
        leader.id
    );

    setValue(
        "full-name",
        leader.full_name || ""
    );

    setValue(
        "public-name",
        leader.public_name || ""
    );

    setValue(
        "position",
        leader.position || ""
    );

    setValue(
        "organization",
        leader.organization || ""
    );

    setValue(
        "keywords",
        leader.keywords || ""
    );

    setValue(
        "nicknames",
        leader.nicknames || ""
    );

    const monitoring =
        getElement(
            "monitoring-enabled"
        );

    if (monitoring) {
        monitoring.checked =
            leader.monitoring_enabled !== false;
    }

    openModal();
}

/* ============================================================
   FORM VALUE
============================================================ */

function setValue(
    id,
    value
) {

    const element =
        getElement(id);

    if (element) {
        element.value =
            value ?? "";
    }
}

/* ============================================================
   RESET FORM
============================================================ */

function resetLeaderForm() {

    const form =
        getElement(
            "leader-form"
        );

    if (form) {
        form.reset();
    }

    setValue(
        "leader-id",
        ""
    );

    const monitoring =
        getElement(
            "monitoring-enabled"
        );

    if (monitoring) {
        monitoring.checked = true;
    }
}

/* ============================================================
   OPEN MODAL
============================================================ */

function openModal() {

    const modal =
        getElement(
            "leader-modal"
        );

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "hidden"
    );

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";

    setTimeout(() => {

        const input =
            getElement(
                "full-name"
            );

        if (input) {
            input.focus();
        }

    }, 100);
}

/* ============================================================
   CLOSE MODAL
============================================================ */

function closeModal() {

    const modal =
        getElement(
            "leader-modal"
        );

    if (!modal) {
        return;
    }

    modal.classList.add(
        "hidden"
    );

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow =
        "";

    editingLeaderId = null;
}

/* ============================================================
   COLLECT FORM
============================================================ */

function collectLeaderForm() {

    const fullName =
        getElement(
            "full-name"
        )?.value.trim();

    if (!fullName) {

        showError(
            "Full name is required."
        );

        getElement(
            "full-name"
        )?.focus();

        return null;
    }

    const payload = {

        full_name:
            fullName,

        public_name:
            getElement(
                "public-name"
            )?.value.trim() || null,

        position:
            getElement(
                "position"
            )?.value.trim() || null,

        organization:
            getElement(
                "organization"
            )?.value.trim() || null,

        keywords:
            getElement(
                "keywords"
            )?.value.trim() || null,

        nicknames:
            getElement(
                "nicknames"
            )?.value.trim() || null,

        monitoring_enabled:
            getElement(
                "monitoring-enabled"
            )?.checked !== false
    };

    return payload;
}

/* ============================================================
   SAVE LEADER
============================================================ */

async function saveLeader(
    event
) {

    event.preventDefault();

    hideElement(
        "leaders-error"
    );

    const payload =
        collectLeaderForm();

    if (!payload) {
        return;
    }

    const button =
        getElement(
            "save-leader-btn"
        );

    const originalText =
        button?.textContent ||
        "Save Leader";

    if (button) {
        button.disabled = true;
        button.textContent =
            editingLeaderId
                ? "Updating..."
                : "Saving...";
    }

    try {

        let response;

        if (editingLeaderId) {

            response =
                await civicLensFetch(
                    `/api/leaders/${encodeURIComponent(
                        editingLeaderId
                    )}`,
                    {
                        method: "PUT",
                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );

        } else {

            response =
                await civicLensFetch(
                    "/api/leaders",
                    {
                        method: "POST",
                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );
        }

        if (!response) {
            return;
        }

        if (!response.ok) {

            let message =
                "Unable to save leader.";

            try {

                const data =
                    await response.json();

                if (data?.detail) {
                    message =
                        data.detail;
                }

            } catch (_) {}

            throw new Error(
                message
            );
        }

        closeModal();

        showSuccess(
            editingLeaderId
                ? "Leader updated successfully."
                : "Leader added successfully."
        );

        await loadLeaders();

    } catch (error) {

        console.error(
            "Save leader error:",
            error
        );

        showError(
            error.message ||
            "Unable to save leader."
        );

    } finally {

        if (button) {
            button.disabled = false;
            button.textContent =
                originalText;
        }
    }
}

/* ============================================================
   TOGGLE MONITORING
============================================================ */

async function toggleMonitoring(
    leaderId
) {

    const leader =
        leaders.find(
            item =>
                String(item.id) ===
                String(leaderId)
        );

    if (!leader) {
        return;
    }

    const newStatus =
        leader.monitoring_enabled === false;

    try {

        const response =
            await civicLensFetch(
                `/api/leaders/${encodeURIComponent(
                    leaderId
                )}`,
                {
                    method: "PUT",
                    body:
                        JSON.stringify({
                            monitoring_enabled:
                                newStatus
                        })
                }
            );

        if (!response) {
            return;
        }

        if (!response.ok) {

            let message =
                "Unable to update monitoring status.";

            try {

                const data =
                    await response.json();

                if (data?.detail) {
                    message =
                        data.detail;
                }

            } catch (_) {}

            throw new Error(
                message
            );
        }

        showSuccess(
            newStatus
                ? "Monitoring enabled."
                : "Monitoring paused."
        );

        await loadLeaders();

    } catch (error) {

        console.error(
            "Toggle monitoring error:",
            error
        );

        showError(
            error.message ||
            "Unable to update monitoring status."
        );
    }
}

/* ============================================================
   DELETE LEADER
============================================================ */

async function deleteLeader(
    leaderId
) {

    const leader =
        leaders.find(
            item =>
                String(item.id) ===
                String(leaderId)
        );

    if (!leader) {
        return;
    }

    const confirmed =
        window.confirm(
            `Delete ${leader.full_name || "this leader"}?\n\nThis action cannot be undone.`
        );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await civicLensFetch(
                `/api/leaders/${encodeURIComponent(
                    leaderId
                )}`,
                {
                    method: "DELETE"
                }
            );

        if (!response) {
            return;
        }

        if (!response.ok) {

            let message =
                "Unable to delete leader.";

            try {

                const data =
                    await response.json();

                if (data?.detail) {
                    message =
                        data.detail;
                }

            } catch (_) {}

            throw new Error(
                message
            );
        }

        showSuccess(
            "Leader deleted successfully."
        );

        await loadLeaders();

    } catch (error) {

        console.error(
            "Delete leader error:",
            error
        );

        showError(
            error.message ||
            "Unable to delete leader."
        );
    }
}

/* ============================================================
   SEARCH
============================================================ */

function searchLeaders(
    searchTerm
) {

    const term =
        String(
            searchTerm || ""
        )
        .trim()
        .toLowerCase();

    if (!term) {

        renderLeaders(
            leaders
        );

        return;
    }

    const filtered =
        leaders.filter(
            leader => {

                const searchable = [
                    leader.full_name,
                    leader.public_name,
                    leader.position,
                    leader.organization,
                    leader.keywords,
                    leader.nicknames
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                return searchable.includes(
                    term
                );
            }
        );

    renderLeaders(
        filtered
    );
}

/* ============================================================
   EVENT HANDLERS
============================================================ */

function setupEventHandlers() {

    const addButton =
        getElement(
            "add-leader-btn"
        );

    if (addButton) {
        addButton.addEventListener(
            "click",
            openAddModal
        );
    }

    const emptyAdd =
        getElement(
            "empty-add-leader"
        );

    if (emptyAdd) {
        emptyAdd.addEventListener(
            "click",
            openAddModal
        );
    }

    const refresh =
        getElement(
            "refresh-leaders"
        );

    if (refresh) {

        refresh.addEventListener(
            "click",
            async () => {

                refresh.disabled =
                    true;

                try {
                    await loadLeaders();
                } finally {
                    refresh.disabled =
                        false;
                }
            }
        );
    }

    const form =
        getElement(
            "leader-form"
        );

    if (form) {
        form.addEventListener(
            "submit",
            saveLeader
        );
    }

    const closeButton =
        getElement(
            "close-modal"
        );

    if (closeButton) {
        closeButton.addEventListener(
            "click",
            closeModal
        );
    }

    const cancelButton =
        getElement(
            "cancel-modal"
        );

    if (cancelButton) {
        cancelButton.addEventListener(
            "click",
            closeModal
        );
    }

    const overlay =
        getElement(
            "modal-overlay"
        );

    if (overlay) {
        overlay.addEventListener(
            "click",
            closeModal
        );
    }

    const search =
        getElement(
            "leader-search"
        );

    if (search) {

        search.addEventListener(
            "input",
            event => {

                searchLeaders(
                    event.target.value
                );
            }
        );
    }

    const grid =
        getElement(
            "leaders-grid"
        );

    if (grid) {

        grid.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-action]"
                    );

                if (!button) {
                    return;
                }

                const action =
                    button.dataset.action;

                const id =
                    button.dataset.id;

                if (!id) {
                    return;
                }

                if (action === "edit") {

                    openEditModal(id);

                } else if (
                    action === "delete"
                ) {

                    deleteLeader(id);

                } else if (
                    action === "toggle"
                ) {

                    toggleMonitoring(id);
                }
            }
        );
    }

    const logout =
        getElement(
            "logout-btn"
        );

    if (logout) {

        logout.addEventListener(
            "click",
            async event => {

                event.preventDefault();

                const client =
                    initializeSupabase();

                if (client) {
                    await client.auth.signOut();
                }

                window.location.href =
                    "/login";
            }
        );
    }

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {
                closeModal();
            }
        }
    );
}

/* ============================================================
   START
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        initializeSupabase();

        const authenticated =
            await verifySession();

        if (!authenticated) {
            return;
        }

        setupEventHandlers();

        await loadUserProfile();

        await loadLeaders();
    }
);

/* ============================================================
   GLOBAL API
============================================================ */

window.civicLensLeaders = {

    loadLeaders,

    openAddModal,

    openEditModal,

    closeModal,

    deleteLeader,

    toggleMonitoring,

    searchLeaders,

    civicLensFetch
};