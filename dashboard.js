
/* =====================================
   UCS ACADEMY - STUDENT DASHBOARD
===================================== */

const studentName = document.getElementById("studentName");
const name = document.getElementById("name");
const roll = document.getElementById("roll");
const studentClass = document.getElementById("class");

const logoutBtn = document.getElementById("logoutBtn");
const joinLiveBtn = document.getElementById("joinLiveBtn");

const APP_ID = "vpaas-magic-cookie-d74b3de509634b94b9d0443c7ff71007";

let currentStudent = null;
let meetingOpen = false;
let jitsiLoadingPromise = null;


// LOAD JITSI API
function loadJitsiAPI() {

    if (window.JitsiMeetExternalAPI) {
        return Promise.resolve();
    }

    if (jitsiLoadingPromise) {
        return jitsiLoadingPromise;
    }

    jitsiLoadingPromise = new Promise((resolve, reject) => {

        const script = document.createElement("script");

        script.src = `https://8x8.vc/${APP_ID}/external_api.js`;

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
    }).catch(error => {
        jitsiLoadingPromise = null;
        throw error;
    });

    return jitsiLoadingPromise;
}


// CHECK STUDENT LOGIN
async function loadStudent() {

    try {

        const response = await fetch("/api/me");

        if (!response.ok) {
            currentStudent = null;
            window.location.href = "/studentlogin.html";
            return false;
        }

        const result = await response.json();

        if (!result.success || !result.student) {
            currentStudent = null;
            window.location.href = "/studentlogin.html";
            return false;
        }

        currentStudent = result.student;

        if (studentName) {
            studentName.textContent = currentStudent.name;
        }

        if (name) {
            name.textContent = currentStudent.name;
        }

        if (roll) {
            roll.textContent = currentStudent.roll_number;
        }

        if (studentClass) {
            studentClass.textContent =
                "Class " + currentStudent.class_name;
        }

        return true;

    } catch (error) {

        console.error("Student Verification Error:", error);

        alert("Server connection failed!");

        return false;
    }
}


// JOIN LIVE CLASS
if (joinLiveBtn) {

    joinLiveBtn.addEventListener("click", async function () {

        if (meetingOpen) return;

        if (!currentStudent) {
            alert("Student details are still loading. Please wait.");
            return;
        }

        joinLiveBtn.disabled = true;
        joinLiveBtn.textContent = "CONNECTING...";

        let meetingBox = null;
        let topbar = document.querySelector(".topbar");
        let container = document.querySelector(".container");

        try {

            // Get Secure Token
            const response = await fetch("/api/jitsi-token", {
                method: "POST"
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Unable to join class."
                );
            }

            if (!result.token || !result.roomName) {
                throw new Error("Invalid Live Class details.");
            }

            // Load Jitsi
            await loadJitsiAPI();

            // Create Meeting Area
            meetingBox = document.createElement("div");
            meetingBox.id = "meetingBox";

            meetingBox.style.cssText = `
                width: 100%;
                height: 100vh;
                background: #111;
                position: fixed;
                inset: 0;
                z-index: 99999;
            `;

            document.body.appendChild(meetingBox);

            // Hide Dashboard
            if (topbar) topbar.style.display = "none";
            if (container) container.style.display = "none";

            // Start Meeting
            const api = new JitsiMeetExternalAPI("8x8.vc", {

                roomName: `${APP_ID}/${result.roomName}`,

                jwt: result.token,

                parentNode: meetingBox,

                width: "100%",

                height: "100%",

                userInfo: {
                    displayName: currentStudent.name
                }
            });

            meetingOpen = true;

            api.addEventListener("readyToClose", function () {

                api.dispose();

                window.location.reload();
            });

        } catch (error) {

            console.error("Live Class Error:", error);

            alert(error.message || "Unable to join Live Class.");

            meetingOpen = false;

            if (meetingBox) {
                meetingBox.remove();
            }

            if (topbar) topbar.style.display = "";
            if (container) container.style.display = "";

            joinLiveBtn.disabled = false;

            joinLiveBtn.textContent = "JOIN LIVE CLASS →";
        }
    });
}


// STUDENT LOGOUT
if (logoutBtn) {

    logoutBtn.addEventListener("click", async function () {

        logoutBtn.disabled = true;
        logoutBtn.textContent = "Logging out...";

        try {

            const response = await fetch("/api/logout", {
                method: "POST"
            });

            if (!response.ok) {
                throw new Error("Logout failed!");
            }

            window.location.href = "/studentlogin.html";

        } catch (error) {

            console.error("Logout Error:", error);

            alert(error.message || "Server connection failed!");

            logoutBtn.disabled = false;
            logoutBtn.textContent = "Logout ↗";
        }
    });
}


// INITIAL STUDENT VERIFICATION
loadStudent();


// CHECK SESSION EVERY 30 SECONDS
setInterval(() => {

    if (!meetingOpen) {
        loadStudent();
    }

}, 30000);
