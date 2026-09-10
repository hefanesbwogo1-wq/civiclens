document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("registrationForm");
    const message = document.getElementById("message");

    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");

    const passwordHint = document.getElementById("passwordHint");
    const matchHint = document.getElementById("matchHint");

    const strengthBars =
        document.querySelectorAll(".password-strength span");

    const submitBtn = document.getElementById("submitBtn");
    const submitText = document.getElementById("submitText");


    /* =========================================
       MESSAGE
    ========================================= */

    function showMessage(text, type) {

        message.textContent = text;
        message.className = "message " + type;

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }


    /* =========================================
       PASSWORD STRENGTH
    ========================================= */

    function passwordStrength(value) {

        let score = 0;

        if (value.length >= 8) score++;
        if (/[A-Z]/.test(value)) score++;
        if (/[0-9]/.test(value)) score++;
        if (/[^A-Za-z0-9]/.test(value)) score++;

        strengthBars.forEach((bar, index) => {

            bar.style.background =
                index < score
                    ? "#087cf5"
                    : "#e5ebf2";

        });

        return score;
    }


    /* =========================================
       PASSWORD INPUT
    ========================================= */

    password.addEventListener("input", () => {

        const score = passwordStrength(password.value);

        if (password.value.length === 0) {

            passwordHint.textContent =
                "Use a mixture of letters, numbers and symbols.";

        } else if (score <= 1) {

            passwordHint.textContent =
                "Password strength: weak";

        } else if (score === 2) {

            passwordHint.textContent =
                "Password strength: fair";

        } else if (score === 3) {

            passwordHint.textContent =
                "Password strength: good";

        } else {

            passwordHint.textContent =
                "Password strength: strong";
        }

    });


    /* =========================================
       CONFIRM PASSWORD
    ========================================= */

    confirmPassword.addEventListener("input", () => {

        if (!confirmPassword.value) {

            matchHint.textContent = "";
            return;
        }

        if (password.value === confirmPassword.value) {

            matchHint.textContent =
                "Passwords match.";

            matchHint.style.color = "#159669";

        } else {

            matchHint.textContent =
                "Passwords do not match.";

            matchHint.style.color = "#dc4b55";
        }

    });


    /* =========================================
       REGISTRATION
    ========================================= */

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        message.className = "message";
        message.textContent = "";


        /* PASSWORD MATCH */

        if (password.value !== confirmPassword.value) {

            showMessage(
                "The passwords do not match.",
                "error"
            );

            return;
        }


        /* PASSWORD STRENGTH */

        if (passwordStrength(password.value) < 3) {

            showMessage(
                "Please create a stronger password before continuing.",
                "error"
            );

            return;
        }


        /* TERMS */

        const terms =
            document.getElementById("terms");

        if (!terms.checked) {

            showMessage(
                "Please accept the Terms of Service and Privacy Policy.",
                "error"
            );

            return;
        }


        /* PLAN */

        const selectedPlan =
            document.querySelector(
                'input[name="subscription_plan"]:checked'
            );


        if (!selectedPlan) {

            showMessage(
                "Please select a subscription plan.",
                "error"
            );

            return;
        }


        /* FORM DATA */

        const data = {

            full_name:
                document.getElementById("fullName").value.trim(),

            email:
                document.getElementById("email").value.trim(),

            phone:
                document.getElementById("phone").value.trim(),

            organization:
                document.getElementById("organization").value.trim(),

            role:
                document.getElementById("role").value.trim(),

            password:
                password.value,

            subscription_plan:
                selectedPlan.value,

            accept_terms:
                true
        };


        /* DISABLE BUTTON */

        submitBtn.disabled = true;

        submitText.textContent =
            "Creating your account...";


        try {

            /* SEND TO BACKEND */

            const response = await fetch(
                "/api/auth/register",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(data)
                }
            );


            /* READ RESPONSE */

            let result;

            try {

                result = await response.json();

            } catch {

                result = {
                    success: false,
                    message: "Invalid server response."
                };

            }


            /* REGISTRATION FAILED */

            if (!response.ok || !result.success) {

                showMessage(
                    result.message ||
                    "Unable to create your account.",
                    "error"
                );

                return;
            }


            /* =========================================
               REGISTRATION SUCCESS
            ========================================= */

            showMessage(
                "Account created successfully! Redirecting to login...",
                "success"
            );


            /* RESET FORM */

            form.reset();

            strengthBars.forEach(
                bar => {
                    bar.style.background = "#e5ebf2";
                }
            );

            passwordHint.textContent =
                "Use a mixture of letters, numbers and symbols.";

            matchHint.textContent = "";


            /* =========================================
               REDIRECT TO LOGIN
            ========================================= */

            setTimeout(() => {

                window.location.replace("/login");

            }, 1800);


        } catch (error) {

            console.error(
                "Registration error:",
                error
            );

            showMessage(
                "Unable to connect to CivicLens. Please try again.",
                "error"
            );

        } finally {

            /*
             * Keep the button disabled briefly after
             * successful registration so the user
             * cannot accidentally submit twice.
             */

            if (!window.location.pathname.endsWith("/login")) {

                submitBtn.disabled = false;

                submitText.textContent =
                    "Create CivicLens Account";
            }

        }

    });

});