"use strict";

/* =========================================================
CIVICLENS — LEADERS
========================================================= */

let supabaseClient = null;
let leaders = [];

const elements = {};

/* =========================================================
INITIALIZE
========================================================= */

document.addEventListener(
"DOMContentLoaded",
initializeLeaders
);

async function initializeLeaders() {
console.log("CivicLens: leaders.js initializing...");

```
cacheElements();

initializeSupabase();

if (!supabaseClient) {
    showPageError(
        "CivicLens configuration is unavailable."
    );
    return;
}

const authenticated =
    await verifySession();

if (!authenticated) {
    return;
}

setupEventHandlers();

await loadUserProfile();

await loadLeaders();

console.log(
    "CivicLens: leaders.js loaded successfully."
);
```

}

/* =========================================================
CACHE ELEMENTS
========================================================= */

function cacheElements() {
elements.userName =
document.getElementById("user-name");

```
elements.userEmail =
    document.getElementById("user-email");

elements.userAvatar =
    document.getElementById("user-avatar");

elements.leadersContainer =
    document.getElementById("leaders-container");

elements.leadersTable =
    document.getElementById("leaders-table");

elements.leaderCount =
    document.getElementById("leader-count");

elements.search =
    document.getElementById("leader-search") ||
    document.getElementById("search-input");

elements.addButton =
    document.getElementById("add-leader-button");

elements.refreshButton =
    document.getElementById("refresh-button");

elements.logoutButton =
    document.getElementById("logout-button");

elements.modal =
    document.getElementById("leader-modal");

elements.modalTitle =
    document.getElementById("modal-title");

elements.form =
    document.getElementById("leader-form");

elements.closeModal =
    document.getElementById("close-modal");

elements.cancelButton =
    document.getElementById("cancel-button");

elements.fullName =
    document.getElementById("full-name");

elements.publicName =
    document.getElementById("public-name");

elements.position =
    document.getElementById("position");

elements.organization =
    document.getElementById("organization");

elements.keywords =
    document.getElementById("keywords");

elements.nicknames =
    document.getElementById("nicknames");

elements.monitoringEnabled =
    document.getElementById("monitoring-enabled");

elements.submitButton =
    document.getElementById("save-leader-button");

elements.formError =
    document.getElementById("form-error");

elements.pageError =
    document.getElementById("page-error");
```

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
console.error(
"CivicLens: Supabase configuration unavailable."
);

```
    return;
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
} catch (error) {
    console.error(
        "CivicLens: Supabase initialization failed:",
        error
    );
}
```

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

```
    if (error) {
        console.error(
            "CivicLens session error:",
            error
        );

        window.location.href =
            "/login";

        return false;
    }

    if (!data?.session) {
        window.location.href =
            "/login";

        return false;
    }

    return true;

} catch (error) {
    console.error(
        "CivicLens session verification failed:",
        error
    );

    window.location.href =
        "/login";

    return false;
}
```

}

/* =========================================================
AUTHENTICATED API FETCH
========================================================= */

async function civicLensFetch(
url,
options = {}
) {
if (!supabaseClient) {
throw new Error(
"Supabase client is unavailable."
);
}

```
const {
    data,
    error
} =
    await supabaseClient.auth.getSession();

if (
    error ||
    !data?.session
) {
    window.location.href =
        "/login";

    throw new Error(
        "Authentication session expired."
    );
}

const headers =
    new Headers(
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
```

}

/* =========================================================
LOAD USER PROFILE
========================================================= */

async function loadUserProfile() {
try {
const {
data,
error
} =
await supabaseClient.auth.getUser();

```
    if (
        error ||
        !data?.user
    ) {
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
                .toUpperCase() || "C";
    }

} catch (error) {
    console.error(
        "CivicLens user profile error:",
        error
    );
}
```

}

/* =========================================================
LOAD LEADERS
========================================================= */

async function loadLeaders() {
showLoading();

```
try {
    console.log(
        "CivicLens: Loading leaders..."
    );

    const response =
        await civicLensFetch(
            "/api/leaders"
        );

    const result =
        await readJson(
            response
        );

    if (!response.ok) {
        throw new Error(
            result?.detail ||
            result?.message ||
            "Unable to load leaders."
        );
    }

    if (
        result &&
        result.success === false
    ) {
        throw new Error(
            result.message ||
            "Unable to load leaders."
        );
    }

    leaders =
        Array.isArray(result?.leaders)
            ? result.leaders
            : [];

    console.log(
        "CivicLens: Leaders loaded:",
        leaders.length
    );

    renderLeaders(
        leaders
    );

    updateLeaderCount();

} catch (error) {
    console.error(
        "CivicLens leaders loading error:",
        error
    );

    leaders = [];

    showPageError(
        error.message ||
        "Unable to load leaders. Please refresh and try again."
    );

}
```

}

/* =========================================================
READ JSON SAFELY
========================================================= */

async function readJson(response) {
const contentType =
response.headers.get(
"content-type"
) || "";

```
if (
    contentType.includes(
        "application/json"
    )
) {
    return await response.json();
}

const text =
    await response.text();

if (!text) {
    return {};
}

try {
    return JSON.parse(text);
} catch {
    return {
        message: text
    };
}
```

}

/* =========================================================
RENDER LEADERS
========================================================= */

function renderLeaders(
leaderList
) {
if (!elements.leadersContainer) {
console.warn(
"CivicLens: leaders-container not found."
);

```
    return;
}

if (!leaderList.length) {
    elements.leadersContainer.innerHTML = `
        <div class="leaders-empty">

            <div class="empty-icon">
                ◉
            </div>

            <h3>
                No leaders yet
            </h3>

            <p>
                Add your first leader to begin monitoring
                public conversations.
            </p>

            <button
                type="button"
                class="primary-button"
                data-action="add-leader"
            >
                + Add Leader
            </button>

        </div>
    `;

    return;
}

/*
 * Support either a table-style container
 * or a normal card/list container.
 */

const tableBody =
    elements.leadersContainer.querySelector(
        "tbody"
    );

if (tableBody) {
    renderLeaderRows(
        tableBody,
        leaderList
    );

    return;
}

elements.leadersContainer.innerHTML =
    leaderList
        .map(
            createLeaderCard
        )
        .join("");
```

}

/* =========================================================
RENDER TABLE ROWS
========================================================= */

function renderLeaderRows(
tbody,
leaderList
) {
tbody.innerHTML =
leaderList
.map(
leader => {
const id =
escapeAttribute(
leader.id || ""
);

```
                const fullName =
                    escapeHtml(
                        leader.full_name ||
                        ""
                    );

                const publicName =
                    escapeHtml(
                        leader.public_name ||
                        ""
                    );

                const position =
                    escapeHtml(
                        leader.position ||
                        ""
                    );

                const organization =
                    escapeHtml(
                        leader.organization ||
                        ""
                    );

                const monitoring =
                    Boolean(
                        leader.monitoring_enabled
                    );

                return `
                    <tr>

                        <td>
                            <strong>
                                ${fullName}
                            </strong>

                            ${
                                publicName
                                    ? `<small>${publicName}</small>`
                                    : ""
                            }
                        </td>

                        <td>
                            ${position || "—"}
                        </td>

                        <td>
                            ${organization || "—"}
                        </td>

                        <td>
                            <span
                                class="status-badge ${
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
                        </td>

                        <td>
                            <div class="leader-actions">

                                <button
                                    type="button"
                                    class="secondary-button"
                                    data-action="edit-leader"
                                    data-leader-id="${id}"
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    class="secondary-button"
                                    data-action="toggle-monitoring"
                                    data-leader-id="${id}"
                                >
                                    ${
                                        monitoring
                                            ? "Pause"
                                            : "Monitor"
                                    }
                                </button>

                                <button
                                    type="button"
                                    class="danger-button"
                                    data-action="delete-leader"
                                    data-leader-id="${id}"
                                >
                                    Delete
                                </button>

                            </div>
                        </td>

                    </tr>
                `;
            }
        )
        .join("");
```

}

/* =========================================================
CREATE LEADER CARD
========================================================= */

function createLeaderCard(
leader
) {
const id =
escapeAttribute(
leader.id || ""
);

```
const fullName =
    escapeHtml(
        leader.full_name ||
        "Unnamed Leader"
    );

const publicName =
    escapeHtml(
        leader.public_name ||
        ""
    );

const position =
    escapeHtml(
        leader.position ||
        ""
    );

const organization =
    escapeHtml(
        leader.organization ||
        ""
    );

const monitoring =
    Boolean(
        leader.monitoring_enabled
    );

const keywords =
    escapeHtml(
        leader.keywords ||
        ""
    );

const nicknames =
    escapeHtml(
        leader.nicknames ||
        ""
    );

return `
    <article
        class="leader-card"
        data-leader-id="${id}"
    >

        <div class="leader-card-header">

            <div class="leader-avatar">
                ${escapeHtml(
                    (
                        leader.public_name ||
                        leader.full_name ||
                        "L"
                    )
                        .trim()
                        .charAt(0)
                        .toUpperCase()
                )}
            </div>

            <div class="leader-card-title">

                <h3>
                    ${fullName}
                </h3>

                ${
                    publicName
                        ? `
                            <span>
                                ${publicName}
                            </span>
                        `
                        : ""
                }

            </div>

            <span
                class="status-badge ${
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

        <div class="leader-card-body">

            ${
                position
                    ? `
                        <p>
                            <strong>
                                Position:
                            </strong>
                            ${position}
                        </p>
                    `
                    : ""
            }

            ${
                organization
                    ? `
                        <p>
                            <strong>
                                Organization:
                            </strong>
                            ${organization}
                        </p>
                    `
                    : ""
            }

            ${
                keywords
                    ? `
                        <p>
                            <strong>
                                Keywords:
                            </strong>
                            ${keywords}
                        </p>
                    `
                    : ""
            }

            ${
                nicknames
                    ? `
                        <p>
                            <strong>
                                Nicknames:
                            </strong>
                            ${nicknames}
                        </p>
                    `
                    : ""
            }

        </div>

        <div class="leader-card-actions">

            <button
                type="button"
                class="secondary-button"
                data-action="edit-leader"
                data-leader-id="${id}"
            >
                Edit
            </button>

            <button
                type="button"
                class="secondary-button"
                data-action="toggle-monitoring"
                data-leader-id="${id}"
            >
                ${
                    monitoring
                        ? "Pause Monitoring"
                        : "Start Monitoring"
                }
            </button>

            <button
                type="button"
                class="danger-button"
                data-action="delete-leader"
                data-leader-id="${id}"
            >
                Delete
            </button>

        </div>

    </article>
`;
```

}

/* =========================================================
EVENT HANDLERS
========================================================= */

function setupEventHandlers() {
/*
* Remove old listeners by cloning only where appropriate.
* Delegated events are used for dynamically generated
* leader buttons.
*/

```
if (
    elements.addButton &&
    !elements.addButton.dataset.civicLensBound
) {
    elements.addButton.dataset.civicLensBound =
        "true";

    elements.addButton.addEventListener(
        "click",
        function (event) {
            event.preventDefault();
            openAddModal();
        }
    );
}

if (
    elements.refreshButton &&
    !elements.refreshButton.dataset.civicLensBound
) {
    elements.refreshButton.dataset.civicLensBound =
        "true";

    elements.refreshButton.addEventListener(
        "click",
        async function (event) {
            event.preventDefault();

            await refreshLeaders();
        }
    );
}

if (
    elements.logoutButton &&
    !elements.logoutButton.dataset.civicLensBound
) {
    elements.logoutButton.dataset.civicLensBound =
        "true";

    elements.logoutButton.addEventListener(
        "click",
        async function (event) {
            event.preventDefault();

            await logoutUser();
        }
    );
}

if (
    elements.closeModal &&
    !elements.closeModal.dataset.civicLensBound
) {
    elements.closeModal.dataset.civicLensBound =
        "true";

    elements.closeModal.addEventListener(
        "click",
        function (event) {
            event.preventDefault();
            closeModal();
        }
    );
}

if (
    elements.cancelButton &&
    !elements.cancelButton.dataset.civicLensBound
) {
    elements.cancelButton.dataset.civicLensBound =
        "true";

    elements.cancelButton.addEventListener(
        "click",
        function (event) {
            event.preventDefault();
            closeModal();
        }
    );
}

if (
    elements.form &&
    !elements.form.dataset.civicLensBound
) {
    elements.form.dataset.civicLensBound =
        "true";

    elements.form.addEventListener(
        "submit",
        async function (event) {
            event.preventDefault();

            await saveLeader();
        }
    );
}

if (
    elements.search &&
    !elements.search.dataset.civicLensBound
) {
    elements.search.dataset.civicLensBound =
        "true";

    elements.search.addEventListener(
        "input",
        function () {
            searchLeaders(
                this.value
            );
        }
    );
}

/*
 * Event delegation for dynamically created
 * Edit / Delete / Monitoring buttons.
 */

if (
    elements.leadersContainer &&
    !elements.leadersContainer.dataset.civicLensBound
) {
    elements.leadersContainer.dataset.civicLensBound =
        "true";

    elements.leadersContainer.addEventListener(
        "click",
        handleLeaderContainerClick
    );
}

/*
 * Global safety net for buttons rendered dynamically.
 */

if (
    !document.body.dataset.civicLensLeaderGlobalBound
) {
    document.body.dataset.civicLensLeaderGlobalBound =
        "true";

    document.addEventListener(
        "click",
        handleGlobalLeaderClick
    );
}

/*
 * Close modal when clicking outside it.
 */

if (
    elements.modal &&
    !elements.modal.dataset.civicLensBound
) {
    elements.modal.dataset.civicLensBound =
        "true";

    elements.modal.addEventListener(
        "click",
        function (event) {
            if (
                event.target ===
                elements.modal
            ) {
                closeModal();
            }
        }
    );
}

/*
 * Escape key closes modal.
 */

if (
    !document.body.dataset.civicLensEscapeBound
) {
    document.body.dataset.civicLensEscapeBound =
        "true";

    document.addEventListener(
        "keydown",
        function (event) {
            if (
                event.key === "Escape"
            ) {
                closeModal();
            }
        }
    );
}
```

}

/* =========================================================
CONTAINER BUTTON HANDLER
========================================================= */

async function handleLeaderContainerClick(
event
) {
const button =
event.target.closest(
"[data-action]"
);

```
if (!button) {
    return;
}

event.preventDefault();
event.stopPropagation();

await handleLeaderAction(
    button
);
```

}

/* =========================================================
GLOBAL BUTTON SAFETY NET
========================================================= */

async function handleGlobalLeaderClick(
event
) {
const button =
event.target.closest(
"[data-action]"
);

```
if (!button) {
    return;
}

/*
 * Only handle CivicLens leader actions.
 */

const action =
    button.dataset.action;

if (
    ![
        "add-leader",
        "edit-leader",
        "delete-leader",
        "toggle-monitoring"
    ].includes(action)
) {
    return;
}

/*
 * If the leaders container already handled it,
 * don't process it twice.
 */

if (
    elements.leadersContainer &&
    elements.leadersContainer.contains(
        button
    )
) {
    return;
}

event.preventDefault();

await handleLeaderAction(
    button
);
```

}

/* =========================================================
LEADER ACTION ROUTER
========================================================= */

async function handleLeaderAction(
button
) {
const action =
button.dataset.action;

```
const leaderId =
    button.dataset.leaderId;

switch (action) {

    case "add-leader":
        openAddModal();
        break;

    case "edit-leader":
        if (leaderId) {
            openEditModal(
                leaderId
            );
        }
        break;

    case "delete-leader":
        if (leaderId) {
            await deleteLeader(
                leaderId
            );
        }
        break;

    case "toggle-monitoring":
        if (leaderId) {
            await toggleMonitoring(
                leaderId
            );
        }
        break;

    default:
        break;
}
```

}

/* =========================================================
OPEN ADD MODAL
========================================================= */

function openAddModal() {
console.log(
"CivicLens: Opening Add Leader modal."
);

```
clearForm();

if (elements.modalTitle) {
    elements.modalTitle.textContent =
        "Add Leader";
}

if (elements.submitButton) {
    elements.submitButton.textContent =
        "Save Leader";
}

elements.form?.removeAttribute(
    "data-edit-id"
);

showModal();
```

}

/* =========================================================
OPEN EDIT MODAL
========================================================= */

function openEditModal(
leaderId
) {
const leader =
leaders.find(
item =>
String(item.id) ===
String(leaderId)
);

```
if (!leader) {
    showFormError(
        "Leader could not be found."
    );

    return;
}

console.log(
    "CivicLens: Editing leader:",
    leaderId
);

if (elements.modalTitle) {
    elements.modalTitle.textContent =
        "Edit Leader";
}

if (elements.submitButton) {
    elements.submitButton.textContent =
        "Update Leader";
}

if (elements.form) {
    elements.form.dataset.editId =
        leader.id;
}

if (elements.fullName) {
    elements.fullName.value =
        leader.full_name || "";
}

if (elements.publicName) {
    elements.publicName.value =
        leader.public_name || "";
}

if (elements.position) {
    elements.position.value =
        leader.position || "";
}

if (elements.organization) {
    elements.organization.value =
        leader.organization || "";
}

if (elements.keywords) {
    elements.keywords.value =
        leader.keywords || "";
}

if (elements.nicknames) {
    elements.nicknames.value =
        leader.nicknames || "";
}

if (elements.monitoringEnabled) {
    elements.monitoringEnabled.checked =
        leader.monitoring_enabled !== false;
}

clearFormError();

showModal();
```

}

/* =========================================================
CLOSE MODAL
========================================================= */

function closeModal() {
if (!elements.modal) {
return;
}

```
elements.modal.classList.remove(
    "open",
    "active",
    "show"
);

elements.modal.setAttribute(
    "aria-hidden",
    "true"
);

if (
    elements.form &&
    elements.form.dataset.editId
) {
    delete elements.form.dataset.editId;
}

clearFormError();
```

}

/* =========================================================
SHOW MODAL
========================================================= */

function showModal() {
if (!elements.modal) {
console.warn(
"CivicLens: leader modal not found."
);

```
    return;
}

elements.modal.classList.add(
    "open"
);

elements.modal.classList.add(
    "active"
);

elements.modal.classList.add(
    "show"
);

elements.modal.setAttribute(
    "aria-hidden",
    "false"
);

setTimeout(
    function () {
        elements.fullName?.focus();
    },
    50
);
```

}

/* =========================================================
SAVE LEADER
========================================================= */

async function saveLeader() {
clearFormError();

```
const fullName =
    elements.fullName?.value.trim() ||
    "";

if (!fullName) {
    showFormError(
        "Full name is required."
    );

    elements.fullName?.focus();

    return;
}

const payload = {
    full_name:
        fullName,

    public_name:
        elements.publicName?.value.trim() ||
        null,

    position:
        elements.position?.value.trim() ||
        null,

    organization:
        elements.organization?.value.trim() ||
        null,

    keywords:
        elements.keywords?.value.trim() ||
        null,

    nicknames:
        elements.nicknames?.value.trim() ||
        null,

    monitoring_enabled:
        elements.monitoringEnabled
            ? elements.monitoringEnabled.checked
            : true
};

const editId =
    elements.form?.dataset.editId;

const isEditing =
    Boolean(editId);

if (elements.submitButton) {
    elements.submitButton.disabled =
        true;

    elements.submitButton.textContent =
        isEditing
            ? "Updating..."
            : "Saving...";
}

try {
    const url =
        isEditing
            ? `/api/leaders/${encodeURIComponent(
                  editId
              )}`
            : "/api/leaders";

    const method =
        isEditing
            ? "PUT"
            : "POST";

    console.log(
        `CivicLens: ${method} ${url}`
    );

    const response =
        await civicLensFetch(
            url,
            {
                method,

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(
                        payload
                    )
            }
        );

    const result =
        await readJson(
            response
        );

    if (!response.ok) {
        throw new Error(
            result?.detail ||
            result?.message ||
            "Unable to save leader."
        );
    }

    if (
        result &&
        result.success === false
    ) {
        throw new Error(
            result.message ||
            "Unable to save leader."
        );
    }

    console.log(
        "CivicLens: Leader saved successfully."
    );

    closeModal();

    await loadLeaders();

} catch (error) {
    console.error(
        "CivicLens leader save error:",
        error
    );

    showFormError(
        error.message ||
        "Unable to save leader."
    );

} finally {
    if (elements.submitButton) {
        elements.submitButton.disabled =
            false;

        elements.submitButton.textContent =
            isEditing
                ? "Update Leader"
                : "Save Leader";
    }
}
```

}

/* =========================================================
DELETE LEADER
========================================================= */

async function deleteLeader(
leaderId
) {
const leader =
leaders.find(
item =>
String(item.id) ===
String(leaderId)
);

```
const leaderName =
    leader?.full_name ||
    leader?.public_name ||
    "this leader";

const confirmed =
    window.confirm(
        `Delete ${leaderName}? This action cannot be undone.`
    );

if (!confirmed) {
    return;
}

console.log(
    "CivicLens: Deleting leader:",
    leaderId
);

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

    const result =
        await readJson(
            response
        );

    if (!response.ok) {
        throw new Error(
            result?.detail ||
            result?.message ||
            "Unable to delete leader."
        );
    }

    if (
        result &&
        result.success === false
    ) {
        throw new Error(
            result.message ||
            "Unable to delete leader."
        );
    }

    console.log(
        "CivicLens: Leader deleted successfully."
    );

    await loadLeaders();

} catch (error) {
    console.error(
        "CivicLens leader delete error:",
        error
    );

    showPageError(
        error.message ||
        "Unable to delete leader."
    );
}
```

}

/* =========================================================
TOGGLE MONITORING
========================================================= */

async function toggleMonitoring(
leaderId
) {
const leader =
leaders.find(
item =>
String(item.id) ===
String(leaderId)
);

```
if (!leader) {
    return;
}

const newStatus =
    leader.monitoring_enabled === false;

console.log(
    "CivicLens: Changing monitoring:",
    leaderId,
    newStatus
);

try {
    const response =
        await civicLensFetch(
            `/api/leaders/${encodeURIComponent(
                leaderId
            )}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        monitoring_enabled:
                            newStatus
                    })
            }
        );

    const result =
        await readJson(
            response
        );

    if (!response.ok) {
        throw new Error(
            result?.detail ||
            result?.message ||
            "Unable to update monitoring status."
        );
    }

    if (
        result &&
        result.success === false
    ) {
        throw new Error(
            result.message ||
            "Unable to update monitoring status."
        );
    }

    await loadLeaders();

} catch (error) {
    console.error(
        "CivicLens monitoring update error:",
        error
    );

    showPageError(
        error.message ||
        "Unable to update monitoring status."
    );
}
```

}

/* =========================================================
SEARCH LEADERS
========================================================= */

function searchLeaders(
query
) {
const normalized =
String(query || "")
.trim()
.toLowerCase();

```
if (!normalized) {
    renderLeaders(
        leaders
    );

    updateLeaderCount();

    return;
}

const filtered =
    leaders.filter(
        leader => {
            const searchable =
                [
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
                normalized
            );
        }
    );

renderLeaders(
    filtered
);

updateLeaderCount(
    filtered.length
);
```

}

/* =========================================================
REFRESH
========================================================= */

async function refreshLeaders() {
if (elements.refreshButton) {
elements.refreshButton.disabled =
true;

```
    elements.refreshButton.textContent =
        "↻ Refreshing...";
}

try {
    await loadLeaders();

} finally {
    if (elements.refreshButton) {
        elements.refreshButton.disabled =
            false;

        elements.refreshButton.textContent =
            "↻ Refresh";
    }
}
```

}

/* =========================================================
LOGOUT
========================================================= */

async function logoutUser() {
console.log(
"CivicLens: Logging out..."
);

```
try {
    if (supabaseClient) {
        await supabaseClient.auth.signOut();
    }
} catch (error) {
    console.error(
        "CivicLens logout error:",
        error
    );
}

window.location.href =
    "/login";
```

}

/* =========================================================
FORM HELPERS
========================================================= */

function clearForm() {
if (elements.form) {
elements.form.reset();

```
    delete elements.form.dataset.editId;
}

if (elements.monitoringEnabled) {
    elements.monitoringEnabled.checked =
        true;
}

clearFormError();
```

}

function clearFormError() {
if (elements.formError) {
elements.formError.textContent =
"";

```
    elements.formError.style.display =
        "none";
}
```

}

function showFormError(
message
) {
if (!elements.formError) {
window.alert(message);
return;
}

```
elements.formError.textContent =
    message;

elements.formError.style.display =
    "block";
```

}

/* =========================================================
PAGE ERROR
========================================================= */

function showPageError(
message
) {
if (elements.pageError) {
elements.pageError.textContent =
message;

```
    elements.pageError.style.display =
        "block";
}

if (elements.leadersContainer) {
    elements.leadersContainer.innerHTML = `
        <div class="leaders-error">
            ${escapeHtml(message)}
        </div>
    `;
}
```

}

/* =========================================================
LOADING
========================================================= */

function showLoading() {
if (!elements.leadersContainer) {
return;
}

```
elements.leadersContainer.innerHTML = `
    <div class="leaders-loading">

        <div class="loading-spinner"></div>

        <p>
            Loading leaders...
        </p>

    </div>
`;
```

}

/* =========================================================
COUNT
========================================================= */

function updateLeaderCount(
count = leaders.length
) {
if (!elements.leaderCount) {
return;
}

```
elements.leaderCount.textContent =
    count;
```

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
"&"
)
.replace(
/</g,
"<"
)
.replace(
/>/g,
">"
)
.replace(
/"/g,
"""
)
.replace(
/'/g,
"'"
);
}

/* =========================================================
ATTRIBUTE ESCAPE
========================================================= */

function escapeAttribute(
value
) {
return escapeHtml(
value
);
}

/* =========================================================
GLOBAL API
========================================================= */

window.civicLensLeaders = {
loadLeaders,
openAddModal,
openEditModal,
closeModal,
deleteLeader,
toggleMonitoring,
searchLeaders,
refreshLeaders,
civicLensFetch
};

console.log(
"CivicLens: leaders.js file loaded."
);
