document.addEventListener("DOMContentLoaded", async () => {
    console.log("CivicLens Dashboard: initializing...");

    // --------------------------------------------------
    // SUPABASE
    // --------------------------------------------------
    let supabaseClient = null;

    try {
        if (
            typeof window.supabase !== "undefined" &&
            window.SUPABASE_URL &&
            window.SUPABASE_ANON_KEY
        ) {
            supabaseClient = window.supabase.createClient(
                window.SUPABASE_URL,
                window.SUPABASE_ANON_KEY
            );

            console.log("CivicLens: Supabase initialized.");
        }
    } catch (error) {
        console.error("CivicLens: Supabase initialization failed:", error);
    }

    // --------------------------------------------------
    // ELEMENTS
    // --------------------------------------------------
    const userName = document.getElementById("user-name");
    const userEmail = document.getElementById("user-email");

    const totalMentions = document.getElementById("total-mentions");
    const positiveMentions = document.getElementById("positive-mentions");
    const neutralMentions = document.getElementById("neutral-mentions");
    const negativeMentions = document.getElementById("negative-mentions");
    const trackedLeaders = document.getElementById("total-leaders");
    const activePlatforms = document.getElementById("total-platforms");

    // --------------------------------------------------
    // NAVIGATION
    // IMPORTANT:
    // Do NOT preventDefault() on normal page links.
    // --------------------------------------------------
    document.querySelectorAll("a[href]").forEach((link) => {
        link.addEventListener("click", (event) => {
            const href = link.getAttribute("href");

            console.log("CivicLens navigation:", href);

            // Allow normal navigation.
            if (
                href &&
                href !== "#" &&
                !href.startsWith("javascript:")
            ) {
                return;
            }

            // Only stop empty "#" links.
            if (href === "#") {
                event.preventDefault();
            }
        });
    });

    // --------------------------------------------------
    // LOAD USER
    // --------------------------------------------------
    async function loadUser() {
        if (!supabaseClient) return;

        try {
            const { data, error } = await supabaseClient.auth.getUser();

            if (error) {
                console.warn("CivicLens user check:", error.message);
                return;
            }

            const user = data?.user;

            if (!user) {
                console.log("CivicLens: No active session.");
                return;
            }

            const metadata = user.user_metadata || {};

            const name =
                metadata.full_name ||
                metadata.name ||
                user.email?.split("@")[0] ||
                "User";

            if (userName) {
                userName.textContent = name;
            }

            if (userEmail) {
                userEmail.textContent = user.email || "";
            }

            console.log("CivicLens: User loaded.");
        } catch (error) {
            console.error("CivicLens: User loading failed:", error);
        }
    }

    // --------------------------------------------------
    // LOAD DASHBOARD STATS
    // --------------------------------------------------
    async function loadStats() {
        try {
            const response = await fetch("/api/mentions/stats");

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) return;

            if (totalMentions) {
                totalMentions.textContent = data.total ?? 0;
            }

            if (positiveMentions) {
                positiveMentions.textContent = data.positive ?? 0;
            }

            if (neutralMentions) {
                neutralMentions.textContent = data.neutral ?? 0;
            }

            if (negativeMentions) {
                negativeMentions.textContent = data.negative ?? 0;
            }

            console.log("CivicLens: Mention statistics loaded.");
        } catch (error) {
            console.error(
                "CivicLens: Failed to load mention statistics:",
                error
            );
        }
    }

    // --------------------------------------------------
    // LOAD LEADER COUNT
    // --------------------------------------------------
    async function loadLeaders() {
        try {
            const response = await fetch("/api/leaders");

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (Array.isArray(data)) {
                if (trackedLeaders) {
                    trackedLeaders.textContent = data.length;
                }
            } else if (Array.isArray(data.leaders)) {
                if (trackedLeaders) {
                    trackedLeaders.textContent = data.leaders.length;
                }
            } else if (trackedLeaders) {
                trackedLeaders.textContent = "0";
            }

        } catch (error) {
            console.error(
                "CivicLens: Failed to load leaders:",
                error
            );

            if (trackedLeaders) {
                trackedLeaders.textContent = "0";
            }
        }
    }

    // --------------------------------------------------
    // LOAD PLATFORM COUNT
    // --------------------------------------------------
    async function loadPlatforms() {
        try {
            const response = await fetch("/api/platforms/stats");

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            let count = 0;

            if (typeof data.count === "number") {
                count = data.count;
            } else if (Array.isArray(data.platforms)) {
                count = data.platforms.length;
            } else if (typeof data.active_platforms === "number") {
                count = data.active_platforms;
            }

            if (activePlatforms) {
                activePlatforms.textContent = count;
            }

            console.log("CivicLens: Platform statistics loaded.");
        } catch (error) {
            console.error(
                "CivicLens: Failed to load platform statistics:",
                error
            );

            if (activePlatforms) {
                activePlatforms.textContent = "0";
            }
        }
    }

    // --------------------------------------------------
    // LOGOUT
    // --------------------------------------------------
    const logoutButtons = document.querySelectorAll(
        "#logout-btn, .logout-btn"
    );

    logoutButtons.forEach((button) => {
        button.addEventListener("click", async (event) => {
            event.preventDefault();

            if (!supabaseClient) {
                window.location.href = "/login";
                return;
            }

            try {
                await supabaseClient.auth.signOut();
            } catch (error) {
                console.error("CivicLens logout error:", error);
            }

            window.location.href = "/login";
        });
    });

    // --------------------------------------------------
    // START
    // --------------------------------------------------
    await loadUser();
    await loadStats();
    await loadLeaders();
    await loadPlatforms();

    console.log("CivicLens Dashboard: ready.");
});