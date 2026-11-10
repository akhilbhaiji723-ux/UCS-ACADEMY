
/* =====================================
   UCS ACADEMY - TEACHER DASHBOARD
===================================== */

const teacherName = document.getElementById("teacherName");
const profileName = document.getElementById("profileName");
const teacherUsername = document.getElementById("teacherUsername");
const teacherClass = document.getElementById("teacherClass");

const startClassBtn = document.getElementById("startClassBtn");
const logoutBtn = document.getElementById("logoutBtn");

const APP_ID = "vpaas-magic-cookie-d74b3de509634b94b9d0443c7ff71007";

let currentTeacher = null;
let meetingOpen = false;


// LOAD JITSI API
function loadJitsiAPI() {
    return new Promise((resolve, reject) => {

        if (window.JitsiMeetExternalAPI) {
            resolve();
            return;
        }

        const existingScript = document.querySelector(
            'script[data-jitsi-api="true"]'
        );

        if (existingScript) {
            existingScript.addEventListener("load", resolve, { once: true });
            existingScript.addEventListener(
                "error",
                () => reject(new Error("Jitsi API load nahi ho payi.")),
                { once: true }
            );
            return;
        }

        const script = document.createElement("script");

        script.src = `https://8x8.vc/${APP_ID}/external_api.js`;
        script.dataset.jitsiApi = "true";

        script.onload = () => {
            if (window.JitsiMeetExternalAPI) {
                resolve();
            } else {
                reject(new Error("Jitsi API initialize nahi ho payi."));
            }
        };

        script.onerror = () => {
            reject(new Error("Jitsi API load nahi ho payi."));
        };

        document.head.appendChild(script);
    });
}


// CHECK TEACHER LOGIN
async function loadTeacher() {

    try {
        const response = await fetch("/api/teacher-me");

        if (!response.ok) {
            window.location.href = "/teacher-login.html";
            return;
        }

        const result = await response.json();
        const teacher = result.teacher;

        if (
            !result.success ||
            !teacher ||
            !teacher.name ||
            !teacher.username ||
            !teacher.class_name
        ) {
            window.location.href = "/teacher-login.html";
            return;
        }

        currentTeacher = teacher;

        if (teacherName) teacherName.textContent = teacher.name;
        if (profileName) profileName.textContent = teacher.name;
        if (teacherUsername) teacherUsername.textContent = teacher.username;

        if (teacherClass) {
            teacherClass.textContent = "Class " + teacher.class_name;
        }

        const liveHeading = document.querySelector(".live-card h2");
        const description = document.querySelector(".live-card .description");

        if (liveHeading) {
            liveHeading.textContent =
                "Class " + teacher.class_name + " Live Class";
        }

        if (description) {
            description.textContent =
                "Start your Class " + teacher.class_name +
                " online classroom and connect with your students.";
        }

    } catch (error) {
        console.error("Teacher Loading Error:", error);
        alert("Unable to load teacher details. Please check your connection.");
    }
}


// START LIVE CLASS
if (startClassBtn) {

    startClassBtn.addEventListener("click", async function () {

        if (!currentTeacher) {
            alert("Teacher details are still loading. Please wait.");
            return;
        }

        if (meetingOpen) return;

        startClassBtn.disabled = true;
        startClassBtn.textContent = "CONNECTING...";

        let meetingBox = null;

        try {

            const response = await fetch("/api/teacher-jitsi-token", {
                method: "POST"
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Unable to start live class."
                );
            }

            if (!result.token || !result.roomName) {
                throw new Error("Invalid Live Class details received.");
            }

            await loadJitsiAPI();

            meetingBox = document.createElement("div");
            meetingBox.id = "meetingBox";

            meetingBox.style.cssText = `
                position: fixed;
                inset: 0;
                width: 100%;
                height: 100vh;
                background: #111;
                z-index: 99999;
            `;

            document.body.appendChild(meetingBox);

            const topbar = document.querySelector(".topbar");
            const container = document.querySelector(".container");

            if (topbar) topbar.style.display = "none";
            if (container) container.style.display = "none";

            const api = new JitsiMeetExternalAPI("8x8.vc", {
                roomName: `${APP_ID}/${result.roomName}`,
                jwt: result.token,
                parentNode: meetingBox,
                width: "100%",
                height: "100%",
                userInfo: {
                    displayName: currentTeacher.name
                }
            });

            meetingOpen = true;

            api.addEventListener("readyToClose", function () {
                api.dispose();
                window.location.reload();
            });

        } catch (error) {

            console.error("Live Class Error:", error);
            alert(error.message || "Live Class could not be started.");

            meetingOpen = false;

            if (meetingBox) meetingBox.remove();

            const topbar = document.querySelector(".topbar");
            const container = document.querySelector(".container");

            if (topbar) topbar.style.display = "";
            if (container) container.style.display = "";

            startClassBtn.disabled = false;
            startClassBtn.innerHTML = 'START LIVE CLASS <span>→</span>';
        }
    });
}


// TEACHER LOGOUT
if (logoutBtn) {

    logoutBtn.addEventListener("click", async function () {

        logoutBtn.disabled = true;
        logoutBtn.textContent = "Logging out...";

        try {

            const response = await fetch("/api/teacher-logout", {
                method: "POST"
            });

            if (!response.ok) {
                throw new Error("Logout failed.");
            }

            window.location.href = "/teacher-login.html";

        } catch (error) {

            console.error("Logout Error:", error);
            alert(error.message || "Unable to logout.");

            logoutBtn.disabled = false;
            logoutBtn.textContent = "Logout ↗";
        }
    });
}


// LOAD TEACHER DETAILS
loadTeacher();
