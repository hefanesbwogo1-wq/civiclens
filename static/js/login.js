"use strict";

document.addEventListener("DOMContentLoaded", () => {

    // =========================================================
    // CIVICLENS LOGIN
    // =========================================================

    const loginForm = document.getElementById("login-form");

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    const rememberCheckbox = document.getElementById("remember");

    const loginButton = document.getElementById("login-button");
    const buttonText = document.getElementById("button-text");
    const buttonLoader = document.getElementById("button-loader");

    const passwordToggle = document.getElementById("password-toggle");
    const eyeOpen = document.getElementById("eye-open");
    const eyeClosed = document.getElementById("eye-closed");

    const forgotPasswordButton =
        document.getElementById("forgot-password");

    const message = document.getElementById("message");

    const emailError =
        document.getElementById("email-error");

    const passwordError =
        document.getElementById("password-error");


    // =========================================================
    // SUPABASE CONFIGURATION
    // =========================================================

    let supabaseClient = null;


    function initializeSupabase() {

        const supabaseUrl = window.SUPABASE_URL;
        const supabaseAnonKey = window.SUPABASE_ANON_KEY;

        console.log("CivicLens: Checking Supabase configuration...");

        if (!supabaseUrl) {
            console.error("CivicLens: SUPABASE_URL is missing.");
            return false;
        }

        if (!supabaseAnonKey) {
            console.error("CivicLens: SUPABASE_ANON_KEY is missing.");
            return false;
        }

        if (
            !window.supabase ||
            typeof window.supabase.createClient !== "function"
        ) {
            console.error(
                "CivicLens: Supabase JavaScript library is not loaded."
            );

            return false;
        }

        try {

            supabaseClient =
                window.supabase.createClient(
                    supabaseUrl,
                    supabaseAnonKey
                );

            console.log("CivicLens: Supabase initialized successfully.");

            return true;

        } catch (error) {

            console.error(
                "CivicLens: Supabase initialization failed:",
                error
            );

            return false;
        }
    }


    const supabaseReady = initializeSupabase();


    // =========================================================
    // HELPER FUNCTIONS
    // =========================================================

    function showMessage(text, type = "error") {

        if (!message) return;

        message.textContent = text;

        message.className = "message";

        if (type === "success") {
            message.classList.add("success");
        } else {
            message.classList.add("error");
        }

        message.style.display = "block";
    }


    function clearMessage() {

        if (!message) return;

        message.textContent = "";
        message.className = "message";
        message.style.display = "none";
    }


    function clearErrors() {

        if (emailError) {
            emailError.textContent = "";
        }

        if (passwordError) {
            passwordError.textContent = "";
        }

        if (emailInput) {
            emailInput.classList.remove("input-error");
        }

        if (passwordInput) {
            passwordInput.classList.remove("input-error");
        }
    }


    function setLoading(loading) {

        if (!loginButton) return;

        loginButton.disabled = loading;

        if (loading) {

            if (buttonText) {
                buttonText.classList.add("hidden");
            }

            if (buttonLoader) {
                buttonLoader.classList.remove("hidden");
            }

        } else {

            if (buttonText) {
                buttonText.classList.remove("hidden");
            }

            if (buttonLoader) {
                buttonLoader.classList.add("hidden");
            }
        }
    }


    function isValidEmail(email) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }


    // =========================================================
    // FORM VALIDATION
    // =========================================================

    function validateForm() {

        clearErrors();

        let valid = true;

        const email =
            emailInput?.value.trim() || "";

        const password =
            passwordInput?.value || "";


        if (!email) {

            if (emailError) {
                emailError.textContent =
                    "Please enter your email address.";
            }

            emailInput?.classList.add("input-error");

            valid = false;

        } else if (!isValidEmail(email)) {

            if (emailError) {
                emailError.textContent =
                    "Please enter a valid email address.";
            }

            emailInput?.classList.add("input-error");

            valid = false;
        }


        if (!password) {

            if (passwordError) {
                passwordError.textContent =
                    "Please enter your password.";
            }

            passwordInput?.classList.add("input-error");

            valid = false;
        }


        return valid;
    }


    // =========================================================
    // PASSWORD SHOW / HIDE
    // =========================================================

    if (passwordToggle && passwordInput) {

        passwordToggle.addEventListener("click", () => {

            const showingPassword =
                passwordInput.type === "text";

            if (showingPassword) {

                passwordInput.type = "password";

                passwordToggle.setAttribute(
                    "aria-label",
                    "Show password"
                );

                if (eyeClosed) {
                    eyeClosed.classList.remove("hidden");
                }

                if (eyeOpen) {
                    eyeOpen.classList.add("hidden");
                }

            } else {

                passwordInput.type = "text";

                passwordToggle.setAttribute(
                    "aria-label",
                    "Hide password"
                );

                if (eyeClosed) {
                    eyeClosed.classList.add("hidden");
                }

                if (eyeOpen) {
                    eyeOpen.classList.remove("hidden");
                }
            }
        });
    }


    // =========================================================
    // LOGIN
    // =========================================================

    if (loginForm) {

        loginForm.addEventListener("submit", async (event) => {

            // VERY IMPORTANT:
            // Prevent browser from sending email/password
            // through the URL as GET parameters.
            event.preventDefault();
            event.stopPropagation();

            clearMessage();

            if (!validateForm()) {
                return;
            }


            // Check Supabase

            if (!supabaseReady || !supabaseClient) {

                showMessage(
                    "Authentication is not configured yet. Please check the CivicLens Supabase configuration.",
                    "error"
                );

                console.error(
                    "CivicLens: Supabase client is unavailable."
                );

                return;
            }


            const email =
                emailInput.value.trim();

            const password =
                passwordInput.value;


            setLoading(true);


            try {

                console.log(
                    "CivicLens: Attempting authentication..."
                );


                const {
                    data,
                    error
                } =
                    await supabaseClient.auth.signInWithPassword({
                        email: email,
                        password: password
                    });


                if (error) {

                    console.error(
                        "CivicLens login error:",
                        error
                    );


                    let errorMessage =
                        "Unable to sign in. Please check your email and password.";


                    if (
                        error.message &&
                        error.message.toLowerCase().includes(
                            "email not confirmed"
                        )
                    ) {

                        errorMessage =
                            "Your email address has not been confirmed yet. Please check your email.";

                    } else if (
                        error.message &&
                        error.message.toLowerCase().includes(
                            "invalid login credentials"
                        )
                    ) {

                        errorMessage =
                            "Invalid email or password.";

                    } else if (
                        error.message &&
                        error.message.toLowerCase().includes(
                            "too many requests"
                        )
                    ) {

                        errorMessage =
                            "Too many login attempts. Please wait a moment and try again.";
                    }


                    showMessage(
                        errorMessage,
                        "error"
                    );

                    setLoading(false);

                    return;
                }


                if (!data || !data.session) {

                    showMessage(
                        "Login was not completed. Please try again.",
                        "error"
                    );

                    setLoading(false);

                    return;
                }


                // =================================================
                // REMEMBER EMAIL
                // =================================================

                if (rememberCheckbox?.checked) {

                    localStorage.setItem(
                        "civiclens_remember_email",
                        email
                    );

                } else {

                    localStorage.removeItem(
                        "civiclens_remember_email"
                    );
                }


                // =================================================
                // SUCCESS
                // =================================================

                showMessage(
                    "Login successful. Opening your workspace...",
                    "success"
                );


                console.log(
                    "CivicLens: Login successful."
                );


                // Give the success message a moment to appear.

                setTimeout(() => {

                    window.location.href =
                        "/dashboard";

                }, 600);


            } catch (error) {

                console.error(
                    "CivicLens unexpected login error:",
                    error
                );

                showMessage(
                    "Something went wrong while signing in. Please try again.",
                    "error"
                );

                setLoading(false);
            }

        });
    }


    // =========================================================
    // FORGOT PASSWORD
    // =========================================================

    if (forgotPasswordButton) {

        forgotPasswordButton.addEventListener(
            "click",
            async () => {

                clearErrors();
                clearMessage();


                if (!supabaseReady || !supabaseClient) {

                    showMessage(
                        "Password recovery is not configured yet.",
                        "error"
                    );

                    return;
                }


                const email =
                    emailInput?.value.trim() || "";


                if (!email) {

                    if (emailError) {
                        emailError.textContent =
                            "Enter your email address first.";
                    }

                    emailInput?.classList.add(
                        "input-error"
                    );

                    emailInput?.focus();

                    return;
                }


                if (!isValidEmail(email)) {

                    if (emailError) {
                        emailError.textContent =
                            "Please enter a valid email address.";
                    }

                    emailInput?.classList.add(
                        "input-error"
                    );

                    emailInput?.focus();

                    return;
                }


                try {

                    forgotPasswordButton.disabled = true;


                    const {
                        error
                    } =
                        await supabaseClient.auth
                            .resetPasswordForEmail(
                                email,
                                {
                                    redirectTo:
                                        `${window.location.origin}/reset-password.html`
                                }
                            );


                    if (error) {

                        console.error(
                            "CivicLens password reset error:",
                            error
                        );

                        showMessage(
                            "Unable to send the password reset email. Please try again.",
                            "error"
                        );

                        return;
                    }


                    showMessage(
                        "Password reset instructions have been sent to your email.",
                        "success"
                    );


                } catch (error) {

                    console.error(
                        "CivicLens password reset error:",
                        error
                    );

                    showMessage(
                        "Something went wrong. Please try again.",
                        "error"
                    );

                } finally {

                    forgotPasswordButton.disabled = false;
                }
            }
        );
    }


    // =========================================================
    // REMEMBERED EMAIL
    // =========================================================

    const rememberedEmail =
        localStorage.getItem(
            "civiclens_remember_email"
        );


    if (
        rememberedEmail &&
        emailInput
    ) {

        emailInput.value =
            rememberedEmail;

        if (rememberCheckbox) {
            rememberCheckbox.checked = true;
        }
    }


    // =========================================================
    // CLEAR FIELD ERRORS WHILE TYPING
    // =========================================================

    if (emailInput) {

        emailInput.addEventListener(
            "input",
            () => {

                if (emailError) {
                    emailError.textContent = "";
                }

                emailInput.classList.remove(
                    "input-error"
                );
            }
        );
    }


    if (passwordInput) {

        passwordInput.addEventListener(
            "input",
            () => {

                if (passwordError) {
                    passwordError.textContent = "";
                }

                passwordInput.classList.remove(
                    "input-error"
                );
            }
        );
    }


    // =========================================================
    // CHECK EXISTING SESSION
    // =========================================================

    async function checkExistingSession() {

        if (!supabaseReady || !supabaseClient) {
            return;
        }


        try {

            const {
                data
            } =
                await supabaseClient.auth.getSession();


            if (
                data &&
                data.session
            ) {

                console.log(
                    "CivicLens: Existing session found."
                );

                window.location.href =
                    "/dashboard";
            }

        } catch (error) {

            console.error(
                "CivicLens session check failed:",
                error
            );
        }
    }


    checkExistingSession();


});