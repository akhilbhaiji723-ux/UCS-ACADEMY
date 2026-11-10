
// ===== AUTOMATIC COPYRIGHT YEAR =====

const yearElement = document.getElementById("year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}


// ===== MOBILE NAVIGATION MENU =====

const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

if (menuBtn && navLinks) {

    menuBtn.addEventListener("click", function () {

        navLinks.classList.toggle("show");

        const isOpen = navLinks.classList.contains("show");

        menuBtn.setAttribute("aria-expanded", isOpen);

        menuBtn.textContent = isOpen ? "✕ Close" : "☰ Menu";

    });


    // Close menu after clicking a navigation link

    document.querySelectorAll(".nav-links a").forEach(function (link) {

        link.addEventListener("click", function () {

            navLinks.classList.remove("show");

            menuBtn.setAttribute("aria-expanded", "false");

            menuBtn.textContent = "☰ Menu";

        });

    });

}


// ===== SEARCH CLASSES AND SUBJECTS =====

const searchInput = document.getElementById("searchInput");

const cards = document.querySelectorAll(".searchable-card");

const groups = document.querySelectorAll(".class-group");

const noResults = document.getElementById("noResults");


if (searchInput) {

    searchInput.addEventListener("input", function () {

        const searchText = searchInput.value
            .trim()
            .toLowerCase();

        let visibleCards = 0;


        // Search through each class card

        cards.forEach(function (card) {

            const cardText = card.textContent.toLowerCase();

            if (cardText.includes(searchText)) {

                card.style.display = "";

                visibleCards++;

            } else {

                card.style.display = "none";

            }

        });


        // Show only groups containing visible cards

        groups.forEach(function (group) {

            const groupCards = group.querySelectorAll(".searchable-card");

            let hasVisibleCard = false;

            groupCards.forEach(function (card) {

                if (card.style.display !== "none") {
                    hasVisibleCard = true;
                }

            });

            group.style.display = hasVisibleCard ? "" : "none";

        });


        // Display message when no results are found

        if (noResults) {

            noResults.style.display =
                visibleCards === 0 ? "block" : "none";

        }

    });

}
