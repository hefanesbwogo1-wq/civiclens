"use strict";

/*
 * CivicLens — Leaders Module
 * Handles:
 * - Loading leaders
 * - Adding leaders
 * - Editing leaders
 * - Deleting leaders
 * - Monitoring toggle
 * - Search/filter
 * - Detailed backend error reporting
 */

document.addEventListener("DOMContentLoaded", () => {
    console.log("CivicLens: Leaders module loaded.");

    const leaderForm = document.getElementById("leader-form");
    const leaderModal = document.getElementById("leader-modal");
    const addLeaderButton = document.getElementById("add-leader-button");
    const closeModalButton = document.getElementById("close-modal");
    const cancelButton = document.getElementById("cancel-leader");
    const leadersContainer = document.getElementById("leaders-container");
    const searchInput = document.getElementById("leader-search");

    let editingLeaderId = null;

    /* =========================================================
       HELPERS
    ========================================================= */

    function showMessage(message, type = "info") {
        const existing = document.getElementById("leaders-message");

        if (existing) {
            existing.remove();
        }

        const box = document.createElement("div");
        box.id = "leaders-message";
        box.className = `leaders-message ${type}`;
        box.textContent = message;

        document.body.appendChild(box);

        setTimeout(() => {
            box.classList.add("show");
        }, 10);

        setTimeout(() => {
            box.classList.remove("show");

            setTimeout(() => {
                box.remove();
            }, 300);
        }, 5000);
    }

    function escapeHtml(value) {
        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function getElement(...ids) {
        for (const id of ids) {
            const element = document.getElementById(id);

            if (element) {
                return element;
            }
        }

        return null;
    }

    /* =========================================================
       MODAL
    ========================================================= */

    function openModal(leader = null) {
        if (!leaderModal) {
            console.error("CivicLens: Leader modal not found.");
            return;
        }

        editingLeaderId = leader ? leader.id : null;

        const title = getElement(
            "leader-modal-title",
            "modal-title"
        );

        const submitButton = getElement(
            "save-leader-button",
            "submit-leader",
            "leader-submit-button"
        );

        const fullName = getElement("full-name");
        const publicName = getElement("public-name");
        const position = getElement("position");
        const organization = getElement("organization");
        const keywords = getElement("keywords");
        const nicknames = getElement("nicknames");
        const monitoring = getElement("monitoring-enabled");

        if (leader) {
            if (title) {
                title.textContent = "Edit Leader";
            }

            if (submitButton) {
                submitButton.textContent = "Update Leader";
            }

            if (fullName) {
                fullName.value = leader.full_name || "";
            }

            if (publicName) {
                publicName.value = leader.public_name || "";
            }

            if (position) {
                position.value = leader.position || "";
            }

            if (organization) {
                organization.value = leader.organization || "";
            }

            if (keywords) {
                keywords.value = leader.keywords || "";
            }

            if (nicknames) {
                nicknames.value = leader.nicknames || "";
            }

            if (monitoring) {
                monitoring.checked =
                    leader.monitoring_enabled !== false;
            }
        } else {
            if (title) {
                title.textContent = "Add Leader";
            }

            if (submitButton) {
                submitButton.textContent = "Save Leader";
            }

            if (leaderForm) {
                leaderForm.reset();
            }

            if (monitoring) {
                monitoring.checked = true;
            }
        }

        leaderModal.classList.add("active");
        leaderModal.style.display = "flex";

        document.body.classList.add("modal-open");

        if (fullName) {
            setTimeout(() => fullName.focus(), 100);
        }
    }

    function closeModal() {
        if (!leaderModal) {
            return;
        }

        leaderModal.classList.remove("active");
        leaderModal.style.display = "none";

        document.body.classList.remove("modal-open");

        editingLeaderId = null;

        if (leaderForm) {
            leaderForm.reset();
        }

        const monitoring = getElement("monitoring-enabled");

        if (monitoring) {
            monitoring.checked = true;
        }
    }

    /* =========================================================
       LOAD LEADERS
    ========================================================= */

    async function loadLeaders() {
        console.log("CivicLens: Loading leaders...");

        if (!leadersContainer) {
            console.error("CivicLens: leaders-container not found.");
            return;
        }

        leadersContainer.innerHTML = `
            <div class="leaders-loading">
                <div class="loading-spinner"></div>
                <p>Loading leaders...</p>
            </div>
        `;

        try {
            const response = await fetch("/api/leaders", {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                cache: "no-store"
            });

            const responseText = await response.text();

            let result = {};

            try {
                result = responseText
                    ? JSON.parse(responseText)
                    : {};
            } catch (error) {
                console.error(
                    "CivicLens: Invalid JSON from leaders API.",
                    responseText
                );

                throw new Error(
                    "The server returned an invalid response."
                );
            }

            if (!response.ok) {
                console.error(
                    "CivicLens: Load leaders failed:",
                    response.status,
                    result
                );

                throw new Error(
                    result.detail ||
                    result.message ||
                    `Request failed: ${response.status}`
                );
            }

            const leaders = Array.isArray(result)
                ? result
                : result.leaders || [];

            console.log(
                `CivicLens: ${leaders.length} leader(s) loaded.`
            );

            renderLeaders(leaders);
            updateLeaderCount(leaders.length);

        } catch (error) {
            console.error(
                "CivicLens: Unable to load leaders:",
                error
            );

            leadersContainer.innerHTML = `
                <div class="leaders-empty error-state">
                    <div class="empty-icon">⚠️</div>
                    <h3>Unable to load leaders</h3>
                    <p>${escapeHtml(error.message)}</p>
                    <button
                        type="button"
                        class="retry-button"
                        id="retry-leaders"
                    >
                        Retry
                    </button>
                </div>
            `;

            const retryButton =
                document.getElementById("retry-leaders");

            if (retryButton) {
                retryButton.addEventListener(
                    "click",
                    loadLeaders
                );
            }
        }
    }

    /* =========================================================
       RENDER LEADERS
    ========================================================= */

    function renderLeaders(leaders) {
        if (!leadersContainer) {
            return;
        }

        if (!leaders.length) {
            leadersContainer.innerHTML = `
                <div class="leaders-empty">
                    <div class="empty-icon">👤</div>
                    <h3>No leaders yet</h3>
                    <p>
                        Add your first leader to start monitoring
                        public conversations.
                    </p>
                    <button
                        type="button"
                        class="empty-add-button"
                        id="empty-add-leader"
                    >
                        + Add First Leader
                    </button>
                </div>
            `;

            const emptyAdd =
                document.getElementById("empty-add-leader");

            if (emptyAdd) {
                emptyAdd.addEventListener(
                    "click",
                    () => openModal()
                );
            }

            return;
        }

        leadersContainer.innerHTML = leaders.map(leader => {
            const name =
                leader.full_name ||
                "Unnamed Leader";

            const publicName =
                leader.public_name ||
                name;

            const position =
                leader.position ||
                "Position not specified";

            const organization =
                leader.organization ||
                "Organization not specified";

            const monitoring =
                leader.monitoring_enabled !== false;

            const keywords =
                leader.keywords || "";

            const nicknames =
                leader.nicknames || "";

            return `
                <article
                    class="leader-card"
                    data-leader-id="${escapeHtml(leader.id)}"
                >

                    <div class="leader-card-header">

                        <div class="leader-avatar">
                            ${escapeHtml(
                                name.charAt(0).toUpperCase()
                            )}
                        </div>

                        <div class="leader-main-info">

                            <h3>
                                ${escapeHtml(name)}
                            </h3>

                            <p class="leader-public-name">
                                ${escapeHtml(publicName)}
                            </p>

                        </div>

                        <div class="leader-status ${
                            monitoring
                                ? "monitoring-on"
                                : "monitoring-off"
                        }">
                            <span class="status-dot"></span>
                            ${
                                monitoring
                                    ? "Monitoring"
                                    : "Paused"
                            }
                        </div>

                    </div>

                    <div class="leader-details">

                        <div class="leader-detail">
                            <span class="detail-label">
                                Position
                            </span>
                            <span class="detail-value">
                                ${escapeHtml(position)}
                            </span>
                        </div>

                        <div class="leader-detail">
                            <span class="detail-label">
                                Organization
                            </span>
                            <span class="detail-value">
                                ${escapeHtml(organization)}
                            </span>
                        </div>

                        <div class="leader-detail">
                            <span class="detail-label">
                                Keywords
                            </span>
                            <span class="detail-value">
                                ${escapeHtml(
                                    keywords || "None"
                                )}
                            </span>
                        </div>

                        <div class="leader-detail">
                            <span class="detail-label">
                                Nicknames
                            </span>
                            <span class="detail-value">
                                ${escapeHtml(
                                    nicknames || "None"
                                )}
                            </span>
                        </div>

                    </div>

                    <div class="leader-card-footer">

                        <button
                            type="button"
                            class="leader-action edit-leader"
                            data-id="${escapeHtml(leader.id)}"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="leader-action toggle-monitoring"
                            data-id="${escapeHtml(leader.id)}"
                            data-enabled="${monitoring}"
                        >
                            ${
                                monitoring
                                    ? "Pause Monitoring"
                                    : "Enable Monitoring"
                            }
                        </button>

                        <button
                            type="button"
                            class="leader-action delete-leader danger"
                            data-id="${escapeHtml(leader.id)}"
                        >
                            Delete
                        </button>

                    </div>

                </article>
            `;
        }).join("");

        attachLeaderActions();
    }

    /* =========================================================
       SEARCH
    ========================================================= */

    function filterLeaders() {
        if (!leadersContainer || !searchInput) {
            return;
        }

        const query =
            searchInput.value
                .trim()
                .toLowerCase();

        const cards =
            leadersContainer.querySelectorAll(
                ".leader-card"
            );

        let visible = 0;

        cards.forEach(card => {
            const text =
                card.textContent.toLowerCase();

            const matches =
                !query ||
                text.includes(query);

            card.style.display =
                matches ? "" : "none";

            if (matches) {
                visible++;
            }
        });

        const noResults =
            document.getElementById(
                "leader-search-empty"
            );

        if (noResults) {
            noResults.remove();
        }

        if (cards.length && visible === 0) {
            leadersContainer.insertAdjacentHTML(
                "beforeend",
                `
                <div
                    id="leader-search-empty"
                    class="leaders-empty"
                >
                    <div class="empty-icon">🔎</div>
                    <h3>No matching leaders</h3>
                    <p>
                        Try another name, position,
                        organization or keyword.
                    </p>
                </div>
                `
            );
        }
    }

    /* =========================================================
       ADD / UPDATE LEADER
    ========================================================= */

    async function saveLeader(event) {
        event.preventDefault();

        console.log(
            "CivicLens: Save Leader button clicked."
        );

        if (!leaderForm) {
            console.error(
                "CivicLens: leader-form not found."
            );
            return;
        }

        const fullName =
            getElement("full-name");

        const publicName =
            getElement("public-name");

        const position =
            getElement("position");

        const organization =
            getElement("organization");

        const keywords =
            getElement("keywords");

        const nicknames =
            getElement("nicknames");

        const monitoring =
            getElement("monitoring-enabled");

        if (!fullName) {
            showMessage(
                "Full Name field was not found.",
                "error"
            );
            return;
        }

        const fullNameValue =
            fullName.value.trim();

        if (!fullNameValue) {
            showMessage(
                "Please enter the leader's full name.",
                "error"
            );

            fullName.focus();
            return;
        }

        const payload = {
            full_name: fullNameValue,
            public_name:
                publicName
                    ? publicName.value.trim()
                    : "",
            position:
                position
                    ? position.value.trim()
                    : "",
            organization:
                organization
                    ? organization.value.trim()
                    : "",
            keywords:
                keywords
                    ? keywords.value.trim()
                    : "",
            nicknames:
                nicknames
                    ? nicknames.value.trim()
                    : "",
            monitoring_enabled:
                monitoring
                    ? monitoring.checked
                    : true
        };

        console.log(
            "CivicLens: Sending leader data:",
            payload
        );

        const submitButton =
            getElement(
                "save-leader-button",
                "submit-leader",
                "leader-submit-button"
            );

        const originalButtonText =
            submitButton
                ? submitButton.textContent
                : "Save Leader";

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent =
                editingLeaderId
                    ? "Updating..."
                    : "Saving...";
        }

        try {
            const url = editingLeaderId
                ? `/api/leaders/${encodeURIComponent(
                    editingLeaderId
                )}`
                : "/api/leaders";

            const method =
                editingLeaderId
                    ? "PUT"
                    : "POST";

            console.log(
                "CivicLens: Request:",
                method,
                url
            );

            const response = await fetch(
                url,
                {
                    method,
                    headers: {
                        "Content-Type":
                            "application/json",
                        "Accept":
                            "application/json"
                    },
                    body: JSON.stringify(payload)
                }
            );

            /*
             * IMPORTANT:
             * Read the complete server response so that
             * the real backend/Supabase error is visible.
             */
            const responseText =
                await response.text();

            console.log(
                "CivicLens: Server status:",
                response.status
            );

            console.log(
                "CivicLens: Server response:",
                responseText
            );

            let result = {};

            try {
                result = responseText
                    ? JSON.parse(responseText)
                    : {};
            } catch (jsonError) {
                console.error(
                    "CivicLens: Server returned non-JSON:",
                    responseText
                );

                result = {
                    detail: responseText
                };
            }

            if (!response.ok) {
                console.error(
                    "CivicLens Add Leader error:",
                    {
                        status:
                            response.status,
                        response:
                            result
                    }
                );

                throw new Error(
                    result.detail ||
                    result.message ||
                    result.error ||
                    `Request failed: ${response.status}`
                );
            }

            if (
                result.success === false
            ) {
                throw new Error(
                    result.detail ||
                    result.message ||
                    "The server could not save the leader."
                );
            }

            console.log(
                "CivicLens: Leader saved successfully.",
                result
            );

            closeModal();

            showMessage(
                editingLeaderId
                    ? "Leader updated successfully."
                    : "Leader added successfully.",
                "success"
            );

            await loadLeaders();

        } catch (error) {

            console.error(
                "CivicLens: Save Leader failed:",
                error
            );

            /*
             * THIS will now display the actual backend
             * error instead of only "Request failed: 500".
             */
            showMessage(
                error.message ||
                "Unable to save leader.",
                "error"
            );

        } finally {

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent =
                    originalButtonText;
            }
        }
    }

    /* =========================================================
       LEADER ACTIONS
    ========================================================= */

    function attachLeaderActions() {

        document
            .querySelectorAll(".edit-leader")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const id =
                            button.dataset.id;

                        if (!id) {
                            return;
                        }

                        try {

                            const response =
                                await fetch(
                                    `/api/leaders/${encodeURIComponent(id)}`
                                );

                            const responseText =
                                await response.text();

                            let result = {};

                            try {
                                result =
                                    responseText
                                        ? JSON.parse(
                                            responseText
                                        )
                                        : {};
                            } catch {
                                throw new Error(
                                    "Invalid server response."
                                );
                            }

                            if (!response.ok) {
                                throw new Error(
                                    result.detail ||
                                    result.message ||
                                    `Request failed: ${response.status}`
                                );
                            }

                            const leader =
                                result.leader ||
                                result;

                            openModal(leader);

                        } catch (error) {

                            console.error(
                                "CivicLens: Edit failed:",
                                error
                            );

                            showMessage(
                                error.message,
                                "error"
                            );
                        }
                    }
                );
            });

        document
            .querySelectorAll(".toggle-monitoring")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const id =
                            button.dataset.id;

                        const currentState =
                            button.dataset.enabled === "true";

                        if (!id) {
                            return;
                        }

                        try {

                            button.disabled = true;

                            const response =
                                await fetch(
                                    `/api/leaders/${encodeURIComponent(id)}`,
                                    {
                                        method: "PUT",
                                        headers: {
                                            "Content-Type":
                                                "application/json",
                                            "Accept":
                                                "application/json"
                                        },
                                        body:
                                            JSON.stringify({
                                                monitoring_enabled:
                                                    !currentState
                                            })
                                    }
                                );

                            const responseText =
                                await response.text();

                            let result = {};

                            try {
                                result =
                                    responseText
                                        ? JSON.parse(
                                            responseText
                                        )
                                        : {};
                            } catch {
                                throw new Error(
                                    responseText ||
                                    "Invalid server response."
                                );
                            }

                            if (!response.ok) {
                                throw new Error(
                                    result.detail ||
                                    result.message ||
                                    `Request failed: ${response.status}`
                                );
                            }

                            showMessage(
                                currentState
                                    ? "Monitoring paused."
                                    : "Monitoring enabled.",
                                "success"
                            );

                            await loadLeaders();

                        } catch (error) {

                            console.error(
                                "CivicLens: Monitoring update failed:",
                                error
                            );

                            showMessage(
                                error.message,
                                "error"
                            );

                        } finally {

                            button.disabled = false;
                        }
                    }
                );
            });

        document
            .querySelectorAll(".delete-leader")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const id =
                            button.dataset.id;

                        if (!id) {
                            return;
                        }

                        const confirmed =
                            window.confirm(
                                "Are you sure you want to delete this leader?"
                            );

                        if (!confirmed) {
                            return;
                        }

                        try {

                            button.disabled = true;

                            const response =
                                await fetch(
                                    `/api/leaders/${encodeURIComponent(id)}`,
                                    {
                                        method: "DELETE",
                                        headers: {
                                            "Accept":
                                                "application/json"
                                        }
                                    }
                                );

                            const responseText =
                                await response.text();

                            let result = {};

                            try {
                                result =
                                    responseText
                                        ? JSON.parse(
                                            responseText
                                        )
                                        : {};
                            } catch {
                                throw new Error(
                                    responseText ||
                                    "Invalid server response."
                                );
                            }

                            if (!response.ok) {
                                throw new Error(
                                    result.detail ||
                                    result.message ||
                                    `Request failed: ${response.status}`
                                );
                            }

                            showMessage(
                                "Leader deleted successfully.",
                                "success"
                            );

                            await loadLeaders();

                        } catch (error) {

                            console.error(
                                "CivicLens: Delete failed:",
                                error
                            );

                            showMessage(
                                error.message,
                                "error"
                            );

                        } finally {

                            button.disabled = false;
                        }
                    }
                );
            });
    }

    /* =========================================================
       UPDATE COUNT
    ========================================================= */

    function updateLeaderCount(count) {

        const elements = [
            document.getElementById("total-leaders"),
            document.getElementById("tracked-leaders"),
            document.getElementById("leader-count")
        ];

        elements.forEach(element => {

            if (element) {
                element.textContent = count;
            }

        });
    }

    /* =========================================================
       EVENT LISTENERS
    ========================================================= */

    if (leaderForm) {
        leaderForm.addEventListener(
            "submit",
            saveLeader
        );
    } else {
        console.warn(
            "CivicLens: leader-form not found."
        );
    }

    if (addLeaderButton) {
        addLeaderButton.addEventListener(
            "click",
            () => openModal()
        );
    }

    if (closeModalButton) {
        closeModalButton.addEventListener(
            "click",
            closeModal
        );
    }

    if (cancelButton) {
        cancelButton.addEventListener(
            "click",
            closeModal
        );
    }

    if (leaderModal) {
        leaderModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    leaderModal
                ) {
                    closeModal();
                }

            }
        );
    }

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            filterLeaders
        );
    }

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                leaderModal &&
                leaderModal.classList.contains("active")
            ) {
                closeModal();
            }

        }
    );

    /* =========================================================
       INITIAL LOAD
    ========================================================= */

    loadLeaders();
});