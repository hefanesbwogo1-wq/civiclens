"use strict";

document.addEventListener(
    "DOMContentLoaded",
    initializeSettings
);


let supabaseClient = null;

let currentUser = null;


async function initializeSettings() {

    initializeSupabase();

    await loadUser();

    loadPreferences();

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

        currentUser =
            data.user;

        const metadata =
            currentUser.user_metadata || {};


        const name =
            metadata.full_name ||
            currentUser.email?.split("@")[0] ||
            "CivicLens User";


        document.getElementById(
            "user-name"
        ).textContent = name;


        document.getElementById(
            "user-email"
        ).textContent =
            currentUser.email || "";


        document.getElementById(
            "user-avatar"
        ).textContent =
            name.trim().charAt(0).toUpperCase();


        document.getElementById(
            "full-name"
        ).value =
            metadata.full_name || "";


        document.getElementById(
            "email"
        ).value =
            currentUser.email || "";


        document.getElementById(
            "organization"
        ).value =
            metadata.organization || "";


        document.getElementById(
            "phone"
        ).value =
            metadata.phone || "";


        document.getElementById(
            "subscription-plan"
        ).textContent =
            metadata.subscription_plan ||
            "Basic";

    } catch (error) {

        console.error(
            "Settings user error:",
            error
        );

    }
}


function loadPreferences() {

    const preferences =
        JSON.parse(
            localStorage.getItem(
                "civiclens_preferences"
            ) || "{}"
        );


    if (
        preferences.mentionAlerts !== undefined
    ) {

        document.getElementById(
            "mention-alerts"
        ).checked =
            preferences.mentionAlerts;

    }


    if (
        preferences.dailySummary !== undefined
    ) {

        document.getElementById(
            "daily-summary"
        ).checked =
            preferences.dailySummary;

    }


    if (
        preferences.emailNotifications !== undefined
    ) {

        document.getElementById(
            "email-notifications"
        ).checked =
            preferences.emailNotifications;

    }

}


function setupEvents() {

    document.getElementById(
        "profile-form"
    ).addEventListener(
        "submit",
        saveProfile
    );


    document.getElementById(
        "save-preferences"
    ).addEventListener(
        "click",
        savePreferences
    );


    document.getElementById(
        "logout-button"
    ).addEventListener(
        "click",
        logoutUser
    );

}


async function saveProfile(event) {

    event.preventDefault();


    if (!supabaseClient || !currentUser) {

        showMessage(
            "Unable to update profile."
        );

        return;

    }


    const fullName =
        document.getElementById(
            "full-name"
        ).value.trim();


    const organization =
        document.getElementById(
            "organization"
        ).value.trim();


    const phone =
        document.getElementById(
            "phone"
        ).value.trim();


    const {
        error
    } =
        await supabaseClient.auth.updateUser({

            data: {

                full_name: fullName,

                organization:
                    organization,

                phone:
                    phone

            }

        });


    if (error) {

        console.error(error);

        showMessage(
            error.message,
            true
        );

        return;

    }


    showMessage(
        "Profile updated successfully."
    );


    await loadUser();

}


function savePreferences() {

    const preferences = {

        mentionAlerts:
            document.getElementById(
                "mention-alerts"
            ).checked,

        dailySummary:
            document.getElementById(
                "daily-summary"
            ).checked,

        emailNotifications:
            document.getElementById(
                "email-notifications"
            ).checked

    };


    localStorage.setItem(
        "civiclens_preferences",
        JSON.stringify(preferences)
    );


    showMessage(
        "Notification preferences saved."
    );

}


function showMessage(
    message,
    error = false
) {

    const element =
        document.getElementById(
            "settings-message"
        );


    element.textContent =
        message;


    element.style.display =
        "block";


    if (error) {

        element.style.background =
            "#fff0f0";

        element.style.color =
            "#b42318";

    } else {

        element.style.background =
            "#eaf8f0";

        element.style.color =
            "#187849";

    }


    setTimeout(
        () => {
            element.style.display =
                "none";
        },
        3500
    );

}


async function logoutUser() {

    if (supabaseClient) {

        await supabaseClient.auth.signOut();

    }

    window.location.href =
        "/login";
}