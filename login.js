
const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");
const loginBtn = document.getElementById("loginBtn");
const className = document.getElementById("className");

// Get selected class from URL
const params = new URLSearchParams(window.location.search);
const selectedClass = params.get("class") || "9";

const validClasses = ["9", "10", "11", "12"];

// Validate class
if (!validClasses.includes(selectedClass)) {
    className.textContent = "Invalid Class";
    loginBtn.disabled = true;
    message.textContent = "Please select a valid class.";
    message.style.color = "#ff6565";
} else {
    const suffix = selectedClass === "11" || selectedClass === "12"
        ? "th"
        : "th";

    className.textContent = "Class " + selectedClass + suffix;
}

// Student Login
loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!validClasses.includes(selectedClass)) {
        message.textContent = "Invalid class selected.";
        message.style.color = "#ff6565";
        return;
    }

    message.textContent = "Verifying your details...";
    message.style.color = "#48b5ff";

    loginBtn.disabled = true;
    loginBtn.textContent = "PLEASE WAIT...";

    const studentData = {
        name: document.getElementById("name").value.trim(),
        roll_number: document.getElementById("roll").value.trim(),
        dob: document.getElementById("dob").value,
        password: document.getElementById("password").value,
        class_name: selectedClass
    };

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(studentData)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Details do not match.");
        }

        message.textContent = "Login successful!";
        message.style.color = "#36d98a";

        window.location.href = "/dashboard.html";

    } catch (error) {
        message.textContent =
            error.message || "Server se connection nahi ho pa raha hai.";

        message.style.color = "#ff6565";

        loginBtn.disabled = false;
        loginBtn.textContent = "LOGIN TO CLASSROOM →";
    }
});
