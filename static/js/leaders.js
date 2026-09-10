"use strict";

document.addEventListener("DOMContentLoaded", async () => {

    console.log("CivicLens: Leaders module loading...");


    // =========================================================
    // SUPABASE
    // =========================================================

    if (
        !window.SUPABASE_URL ||
        !window.SUPABASE_ANON_KEY
    ) {

        console.error(
            "CivicLens: Supabase configuration missing."
        );

        return;
    }


    const supabaseClient =
        window.supabase.createClient(
            window.SUPABASE_URL,
            window.SUPABASE_ANON_KEY
        );


    // =========================================================
    // ELEMENTS
    // =========================================================

    const modal =
        document.getElementById("leader-modal");

    const form =
        document.getElementById("leader-form");

    const addButton =
        document.getElementById("add-leader-button");

    const closeButton =
        document.getElementById("close-modal");

    const cancelButton =
        document.getElementById("cancel-button");

    const saveButton =
        document.getElementById("save-button");

    const formMessage =
        document.getElementById("form-message");

    const searchInput =
        document.getElementById("search-input");

    const leadersGrid =
        document.getElementById("leaders-grid");

    const leaderCount =
        document.getElementById("leader-count");

    const modalTitle =
        document.getElementById("modal-title");

    const leaderId =
        document.getElementById("leader-id");

    const fullName =
        document.getElementById("full-name");

    const publicName =
        document.getElementById("public-name");

    const position =
        document.getElementById("position");

    const organization =
        document.getElementById("organization");

    const keywords =
        document.getElementById("keywords");

    const nicknames =
        document.getElementById("nicknames");

    const monitoringEnabled =
        document.getElementById("monitoring-enabled");

    const logoutButton =
        document.getElementById("logout-button");


    let leaders = [];


    // =========================================================
    // AUTHENTICATION
    // =========================================================

    const {
        data: {
            session
        },
        error: sessionError
    } = await supabaseClient.auth.getSession();


    if (
        sessionError ||
        !session ||
        !session.user
    ) {

        console.log(
            "CivicLens: No active session."
        );

        window.location.href = "/login";

        return;
    }


    // =========================================================
    // USER DISPLAY
    // =========================================================

    const user =
        session.user;

    const metadata =
        user.user_metadata || {};

    const name =
        metadata.full_name ||
        user.email?.split("@")[0] ||
        "CivicLens User";


    const userName =
        document.getElementById("user-name");

    const userEmail =
        document.getElementById("user-email");

    const avatar =
        document.getElementById("user-avatar");


    if (userName) {
        userName.textContent = name;
    }

    if (userEmail) {
        userEmail.textContent =
            user.email || "";
    }

    if (avatar) {

        avatar.textContent =
            name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map(
                    word =>
                        word.charAt(0)
                )
                .join("")
                .toUpperCase() || "C";
    }


    // =========================================================
    // API HELPER
    // =========================================================

    async function apiRequest(
        url,
        options = {}
    ) {

        const {
            data: {
                session: currentSession
            }
        } = await supabaseClient.auth.getSession();


        if (
            !currentSession ||
            !currentSession.access_token
        ) {

            window.location.href = "/login";

            throw new Error(
                "Authentication required."
            );
        }


        const headers = {
            "Content-Type": "application/json",
            "Authorization":
                `Bearer ${currentSession.access_token}`,
            ...(options.headers || {})
        };


        const response =
            await fetch(
                url,
                {
                    ...options,
                    headers
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Request failed."
            );
        }


        return result;
    }


    // =========================================================
    // LOAD LEADERS
    // =========================================================

    async function loadLeaders() {

        leadersGrid.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading leaders...</p>
            </div>
        `;


        try {

            const result =
                await apiRequest(
                    "/api/leaders"
                );


            leaders =
                result.leaders || [];


            renderLeaders(
                leaders
            );


        } catch (error) {

            console.error(
                "CivicLens leaders error:",
                error
            );


            leadersGrid.innerHTML = `
                <div class="empty-leaders">
                    <div class="empty-leaders-icon">
                        !
                    </div>

                    <h3>
                        Unable to load leaders
                    </h3>

                    <p>
                        ${escapeHtml(error.message)}
                    </p>

                    <button
                        class="primary-button"
                        id="retry-leaders"
                        type="button"
                    >
                        Try Again
                    </button>
                </div>
            `;


            document
                .getElementById("retry-leaders")
                ?.addEventListener(
                    "click",
                    loadLeaders
                );
        }
    }


    // =========================================================
    // RENDER LEADERS
    // =========================================================

    function renderLeaders(
        items
    ) {

        leaderCount.textContent =
            items.length;


        if (!items.length) {

            leadersGrid.innerHTML = `
                <div class="empty-leaders">

                    <div class="empty-leaders-icon">
                        ♟
                    </div>

                    <h3>
                        No leaders yet
                    </h3>

                    <p>
                        Add your first leader to begin
                        building your CivicLens monitoring list.
                    </p>

                    <button
                        class="primary-button"
                        id="empty-add-button"
                        type="button"
                    >
                        + Add Your First Leader
                    </button>

                </div>
            `;


            document
                .getElementById("empty-add-button")
                ?.addEventListener(
                    "click",
                    openAddModal
                );

            return;
        }


        leadersGrid.innerHTML =
            items
                .map(
                    leader =>
                        createLeaderCard(
                            leader
                        )
                )
                .join("");


        attachCardEvents();
    }


    // =========================================================
    // LEADER CARD
    // =========================================================

    function createLeaderCard(
        leader
    ) {

        const initials =
            getInitials(
                leader.full_name
            );


        const keywords =
            splitTags(
                leader.keywords
            );

        const nicknames =
            splitTags(
                leader.nicknames
            );


        return `
            <article
                class="leader-card"
                data-id="${leader.id}"
            >

                <div class="leader-card-top">

                    <div class="leader-main">

                        <div class="leader-avatar">
                            ${escapeHtml(initials)}
                        </div>

                        <div>

                            <div class="leader-name">
                                ${escapeHtml(
                                    leader.public_name ||
                                    leader.full_name
                                )}
                            </div>

                            ${
                                leader.position
                                ? `
                                    <div class="leader-position">
                                        ${escapeHtml(
                                            leader.position
                                        )}
                                    </div>
                                `
                                : ""
                            }

                            ${
                                leader.organization
                                ? `
                                    <div class="leader-organization">
                                        ${escapeHtml(
                                            leader.organization
                                        )}
                                    </div>
                                `
                                : ""
                            }

                        </div>

                    </div>


                    <span
                        class="monitoring-badge ${
                            leader.monitoring_enabled
                            ? "on"
                            : "off"
                        }"
                    >
                        ${
                            leader.monitoring_enabled
                            ? "MONITORING"
                            : "PAUSED"
                        }
                    </span>

                </div>


                <div class="leader-details">

                    <div class="detail-label">
                        KEYWORDS
                    </div>

                    <div class="tag-list">

                        ${
                            keywords.length
                            ? keywords
                                .slice(0, 6)
                                .map(
                                    tag =>
                                        `<span class="tag">
                                            ${escapeHtml(tag)}
                                        </span>`
                                )
                                .join("")
                            : `
                                <span class="no-data">
                                    No keywords added
                                </span>
                            `
                        }

                    </div>


                    <div
                        class="detail-label"
                        style="margin-top:14px;"
                    >
                        NICKNAMES
                    </div>

                    <div class="tag-list">

                        ${
                            nicknames.length
                            ? nicknames
                                .slice(0, 4)
                                .map(
                                    tag =>
                                        `<span class="tag">
                                            ${escapeHtml(tag)}
                                        </span>`
                                )
                                .join("")
                            : `
                                <span class="no-data">
                                    No nicknames added
                                </span>
                            `
                        }

                    </div>

                </div>


                <div class="leader-actions">

                    <button
                        class="card-button edit"
                        data-action="edit"
                        data-id="${leader.id}"
                        type="button"
                    >
                        Edit
                    </button>

                    <button
                        class="card-button monitor"
                        data-action="monitor"
                        data-id="${leader.id}"
                        type="button"
                    >
                        ${
                            leader.monitoring_enabled
                            ? "Pause"
                            : "Monitor"
                        }
                    </button>

                    <button
                        class="card-button delete"
                        data-action="delete"
                        data-id="${leader.id}"
                        type="button"
                    >
                        Delete
                    </button>

                </div>

            </article>
        `;
    }


    // =========================================================
    // CARD EVENTS
    // =========================================================

    function attachCardEvents() {

        document
            .querySelectorAll(
                "[data-action='edit']"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            Number(
                                button.dataset.id
                            );

                        const leader =
                            leaders.find(
                                item =>
                                    item.id === id
                            );

                        if (leader) {
                            openEditModal(
                                leader
                            );
                        }
                    }
                );
            });


        document
            .querySelectorAll(
                "[data-action='monitor']"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const id =
                            Number(
                                button.dataset.id
                            );

                        await toggleMonitoring(
                            id
                        );
                    }
                );
            });


        document
            .querySelectorAll(
                "[data-action='delete']"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const id =
                            Number(
                                button.dataset.id
                            );

                        await deleteLeader(
                            id
                        );
                    }
                );
            });
    }


    // =========================================================
    // ADD MODAL
    // =========================================================

    function openAddModal() {

        form.reset();

        leaderId.value = "";

        monitoringEnabled.checked = true;

        modalTitle.textContent =
            "Add Leader";

        saveButton.textContent =
            "Save Leader";

        clearFormMessage();

        modal.classList.remove(
            "hidden"
        );

        setTimeout(
            () => fullName.focus(),
            100
        );
    }


    // =========================================================
    // EDIT MODAL
    // =========================================================

    function openEditModal(
        leader
    ) {

        leaderId.value =
            leader.id;

        fullName.value =
            leader.full_name || "";

        publicName.value =
            leader.public_name || "";

        position.value =
            leader.position || "";

        organization.value =
            leader.organization || "";

        keywords.value =
            leader.keywords || "";

        nicknames.value =
            leader.nicknames || "";

        monitoringEnabled.checked =
            Boolean(
                leader.monitoring_enabled
            );

        modalTitle.textContent =
            "Edit Leader";

        saveButton.textContent =
            "Update Leader";

        clearFormMessage();

        modal.classList.remove(
            "hidden"
        );

        setTimeout(
            () => fullName.focus(),
            100
        );
    }


    // =========================================================
    // CLOSE MODAL
    // =========================================================

    function closeModal() {

        modal.classList.add(
            "hidden"
        );

        form.reset();

        leaderId.value = "";

        clearFormMessage();
    }


    addButton.addEventListener(
        "click",
        openAddModal
    );

    closeButton.addEventListener(
        "click",
        closeModal
    );

    cancelButton.addEventListener(
        "click",
        closeModal
    );


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {
                closeModal();
            }
        }
    );


    // =========================================================
    // SAVE LEADER
    // =========================================================

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            clearFormMessage();


            if (
                !fullName.value.trim()
            ) {

                showFormMessage(
                    "Please enter the leader's full name.",
                    "error"
                );

                fullName.focus();

                return;
            }


            saveButton.disabled = true;

            saveButton.textContent =
                leaderId.value
                ? "Updating..."
                : "Saving...";


            const payload = {

                full_name:
                    fullName.value.trim(),

                public_name:
                    publicName.value.trim(),

                position:
                    position.value.trim(),

                organization:
                    organization.value.trim(),

                keywords:
                    keywords.value.trim(),

                nicknames:
                    nicknames.value.trim(),

                monitoring_enabled:
                    monitoringEnabled.checked
            };


            try {

                if (leaderId.value) {

                    await apiRequest(
                        `/api/leaders/${leaderId.value}`,
                        {
                            method: "PUT",
                            body:
                                JSON.stringify(
                                    payload
                                )
                        }
                    );

                } else {

                    await apiRequest(
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


                closeModal();

                await loadLeaders();


            } catch (error) {

                console.error(
                    "CivicLens save leader error:",
                    error
                );

                showFormMessage(
                    error.message,
                    "error"
                );

            } finally {

                saveButton.disabled =
                    false;

                saveButton.textContent =
                    leaderId.value
                    ? "Update Leader"
                    : "Save Leader";
            }
        }
    );


    // =========================================================
    // DELETE
    // =========================================================

    async function deleteLeader(
        id
    ) {

        const leader =
            leaders.find(
                item => item.id === id
            );


        if (!leader) {
            return;
        }


        const confirmed =
            window.confirm(
                `Delete "${leader.full_name}" from your CivicLens leaders?`
            );


        if (!confirmed) {
            return;
        }


        try {

            await apiRequest(
                `/api/leaders/${id}`,
                {
                    method: "DELETE"
                }
            );


            await loadLeaders();


        } catch (error) {

            alert(
                error.message
            );
        }
    }


    // =========================================================
    // TOGGLE MONITORING
    // =========================================================

    async function toggleMonitoring(
        id
    ) {

        try {

            await apiRequest(
                `/api/leaders/${id}/monitoring`,
                {
                    method: "PATCH"
                }
            );


            await loadLeaders();


        } catch (error) {

            alert(
                error.message
            );
        }
    }


    // =========================================================
    // SEARCH
    // =========================================================

    searchInput.addEventListener(
        "input",
        () => {

            const query =
                searchInput.value
                    .trim()
                    .toLowerCase();


            if (!query) {

                renderLeaders(
                    leaders
                );

                return;
            }


            const filtered =
                leaders.filter(
                    leader =>
                        [
                            leader.full_name,
                            leader.public_name,
                            leader.position,
                            leader.organization,
                            leader.keywords,
                            leader.nicknames
                        ]
                        .join(" ")
                        .toLowerCase()
                        .includes(query)
                );


            renderLeaders(
                filtered
            );
        }
    );


    // =========================================================
    // LOGOUT
    // =========================================================

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            async () => {

                await supabaseClient.auth.signOut();

                window.location.href =
                    "/login";
            }
        );
    }


    // =========================================================
    // HELPERS
    // =========================================================

    function splitTags(
        value
    ) {

        if (!value) {
            return [];
        }

        return value
            .split(",")
            .map(
                item =>
                    item.trim()
            )
            .filter(Boolean);
    }


    function getInitials(
        value
    ) {

        return value
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map(
                word =>
                    word
                        .charAt(0)
                        .toUpperCase()
            )
            .join("");
    }


    function escapeHtml(
        value
    ) {

        return String(value || "")
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


    function showFormMessage(
        message,
        type
    ) {

        formMessage.textContent =
            message;

        formMessage.className =
            `form-message show ${type}`;
    }


    function clearFormMessage() {

        formMessage.textContent =
            "";

        formMessage.className =
            "form-message";
    }


    // =========================================================
    // START
    // =========================================================

    await loadLeaders();

    console.log(
        "CivicLens: Leaders module ready."
    );

});