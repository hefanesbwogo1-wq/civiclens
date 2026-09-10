document.addEventListener("DOMContentLoaded", () => {

    const mobileMenuBtn = document.getElementById("mobileMenuBtn");

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener("click", () => {
            alert("CivicLens mobile navigation will be available in the next interface update.");
        });
    }

    // Smooth navigation
    document.querySelectorAll('a[href^="#"]').forEach(link => {

        link.addEventListener("click", event => {

            const targetId = link.getAttribute("href");

            if (targetId === "#") return;

            const target = document.querySelector(targetId);

            if (target) {
                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }

        });

    });

});