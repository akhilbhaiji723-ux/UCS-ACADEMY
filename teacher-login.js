
const loginForm = document.getElementById("teacherLoginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const togglePassword = document.getElementById("togglePassword");
const loginBtn = document.getElementById("loginBtn");
const message = document.getElementById("message");

// Show / Hide Password
togglePassword.addEventListener("click", () => {

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        togglePassword.textContent = "Hide";
    } else {
        passwordInput.type = "password";
        togglePassword.textContent = "Show";
    }

});


// Teacher Login
loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    message.textContent = "";

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    loginBtn.disabled = true;
    loginBtn.innerHTML = "Please wait...";

    try {

        const response = await fetch("/api/teacher-login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                password
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Login failed.");
        }

        // Get Teacher Class from Server
        const teacherClass = String(result.teacher.class_name);

        // Class-wise Dashboard
        const dashboards = {
            "9": "teacher-dashboard-9.html",
            "10": "teacher-dashboard-10.html",
            "11": "teacher-dashboard-11.html",
            "12": "teacher-dashboard-12.html"
        };

        if (!dashboards[teacherClass]) {
            throw new Error("Invalid teacher class.");
        }

        message.style.color = "#64e6a2";
        message.textContent = "Login successful!";

        // Redirect to Correct Dashboard
        window.location.href = dashboards[teacherClass];

    } catch (error) {

        message.style.color = "#ff7777";
        message.textContent = error.message;

        loginBtn.disabled = false;
        loginBtn.innerHTML = 'Login to Teacher Portal <span>→</span>';

    }

});
