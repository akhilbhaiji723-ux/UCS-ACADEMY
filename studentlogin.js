// Automatically update footer year

const year = document.querySelector(".copyright");

if (year) {
    year.innerHTML =
        `© ${new Date().getFullYear()} UCS ACADEMY. All Rights Reserved.`;
}

// Home button navigation

const homeButton = document.querySelector(".home-btn");

if (homeButton) {
    homeButton.addEventListener("click", function () {
        window.location.href = "index.html";
    });
}