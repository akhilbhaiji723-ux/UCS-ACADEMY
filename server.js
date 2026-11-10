
require("dotenv").config();

const express = require("express");
const session = require("express-session");
const connectPgSimple = require("connect-pg-simple");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const pool = require("./postgres");

const app = express();

// =====================================
// UCS ACADEMY - CONFIGURATION
// =====================================

const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET;
const JAAS_APP_ID = process.env.JAAS_APP_ID;
const JAAS_KEY_ID = process.env.JAAS_KEY_ID;
const JAAS_PRIVATE_KEY_PATH = process.env.JAAS_PRIVATE_KEY_PATH;

const ALLOWED_CLASSES = ["9", "10", "11", "12"];

if (!SESSION_SECRET || SESSION_SECRET.length < 64) {
    console.error("ERROR: SESSION_SECRET missing or too short in environment.");
    process.exit(1);
}

if (!JAAS_APP_ID || !JAAS_KEY_ID || !JAAS_PRIVATE_KEY_PATH) {
    console.error("ERROR: JaaS settings missing in environment.");
    process.exit(1);
}

if (!fs.existsSync(JAAS_PRIVATE_KEY_PATH)) {
    console.error("ERROR: JaaS private key file not found:", JAAS_PRIVATE_KEY_PATH);
    process.exit(1);
}

let PRIVATE_KEY;

try {
    PRIVATE_KEY = fs.readFileSync(JAAS_PRIVATE_KEY_PATH, "utf8");
} catch (error) {
    console.error("ERROR: Could not read JaaS private key:", error.message);
    process.exit(1);
}

// =====================================
// BASIC SETTINGS
// =====================================

app.disable("x-powered-by");

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({
    extended: true,
    limit: "20kb"
}));

// =====================================
// POSTGRESQL SESSION STORE
// =====================================

const PgSessionStore = connectPgSimple(session);

app.use(session({
    store: new PgSessionStore({
        pool,
        tableName: "user_sessions",
        createTableIfMissing: true,
        pruneSessionInterval: 15 * 60
    }),
    name: "ucs.sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// =====================================
// SESSION HELPERS
// =====================================

function regenerateSession(req) {
    return new Promise((resolve, reject) => {
        req.session.regenerate((error) => {
            if (error) reject(error);
            else resolve();
        });
    });
}

function saveSession(req) {
    return new Promise((resolve, reject) => {
        req.session.save((error) => {
            if (error) reject(error);
            else resolve();
        });
    });
}

function destroySession(req) {
    return new Promise((resolve, reject) => {
        if (!req.session) return resolve();

        req.session.destroy((error) => {
            if (error) reject(error);
            else resolve();
        });
    });
}

// =====================================
// STUDENT LOOKUP HELPER
// =====================================

async function getLoggedInStudent(req) {
    if (!req.session.studentRoll || !req.session.studentClass) {
        return null;
    }

    const result = await pool.query(
        `SELECT name, roll_number, class_name, active_session_id
         FROM students
         WHERE roll_number = $1 AND class_name = $2
         LIMIT 1`,
        [req.session.studentRoll, req.session.studentClass]
    );

    const student = result.rows[0];

    if (!student || student.active_session_id !== req.sessionID) {
        return null;
    }

    return student;
}

// =====================================
// BLOCK SENSITIVE FILES
// =====================================

app.use((req, res, next) => {
    const requestedPath = req.path;

    const blockedFiles =
        /(^|\/)(server\.js|database\.js|postgres\.js|setup-postgres\.js|migrate-database\.js|add-student\.js|add-teacher\.js|check-database\.js|package(-lock)?\.json|\.env(\..*)?|node_modules|\.git)(\/|$)/i;

    const blockedExtensions =
        /\.(db|sqlite|sqlite3|pem|key)(?:$|[-.])/i;

    if (blockedFiles.test(requestedPath) || blockedExtensions.test(requestedPath)) {
        return res.sendStatus(404);
    }

    next();
});

// =====================================
// HOME PAGE & STATIC FILES
// =====================================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.use(express.static(__dirname, {
    dotfiles: "deny",
    index: false
}));

// =====================================
// STUDENT LOGIN
// =====================================

app.post("/api/login", async (req, res) => {
    try {
        const name = typeof req.body.name === "string"
            ? req.body.name.trim()
            : "";

        const rollNumber = typeof req.body.roll_number === "string"
            ? req.body.roll_number.trim()
            : "";

        const dob = typeof req.body.dob === "string"
            ? req.body.dob.trim()
            : "";

        const password = typeof req.body.password === "string"
            ? req.body.password
            : "";

        const className = String(req.body.class_name || "");

        if (!name || !rollNumber || !dob || !password || !className) {
            return res.status(400).json({
                success: false,
                message: "Sabhi details bharna zaroori hai."
            });
        }

        if (!ALLOWED_CLASSES.includes(className)) {
            return res.status(400).json({
                success: false,
                message: "Invalid class selected."
            });
        }

        const result = await pool.query(
            `SELECT *
             FROM students
             WHERE roll_number = $1 AND class_name = $2
             LIMIT 1`,
            [rollNumber, className]
        );

        const student = result.rows[0];

        if (!student) {
            return res.status(401).json({
                success: false,
                message: "Student details galat hain."
            });
        }

        const nameMatch =
            String(student.name).trim().toLowerCase() === name.toLowerCase();

        const dobMatch = String(student.dob) === dob;

        const passwordMatch = await bcrypt.compare(
            password,
            student.password_hash
        );

        if (!nameMatch || !dobMatch || !passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Student details galat hain."
            });
        }

        await regenerateSession(req);

        req.session.studentRoll = student.roll_number;
        req.session.studentClass = String(student.class_name);

        await pool.query(
            `UPDATE students
             SET active_session_id = $1
             WHERE roll_number = $2 AND class_name = $3`,
            [req.sessionID, student.roll_number, student.class_name]
        );

        try {
            await saveSession(req);
        } catch (error) {
            await pool.query(
                `UPDATE students
                 SET active_session_id = NULL
                 WHERE roll_number = $1
                   AND class_name = $2
                   AND active_session_id = $3`,
                [student.roll_number, student.class_name, req.sessionID]
            );
            throw error;
        }

        return res.json({
            success: true,
            message: "Login successful!",
            student: {
                name: student.name,
                roll_number: student.roll_number,
                class_name: String(student.class_name)
            }
        });

    } catch (error) {
        console.error("Student Login Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error."
        });
    }
});

// =====================================
// STUDENT SESSION CHECK
// =====================================

app.get("/api/me", async (req, res) => {
    try {
        const student = await getLoggedInStudent(req);

        if (!student) {
            await destroySession(req);
            res.clearCookie("ucs.sid", { path: "/" });

            return res.status(401).json({
                success: false,
                message: "Student session invalid hai."
            });
        }

        return res.json({
            success: true,
            student: {
                name: student.name,
                roll_number: student.roll_number,
                class_name: String(student.class_name)
            }
        });

    } catch (error) {
        console.error("Student Session Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error."
        });
    }
});

// =====================================
// JITSI TOKEN HELPER
// =====================================

function createJitsiToken(userId, userName, roomName, moderator) {
    const now = Math.floor(Date.now() / 1000);

    return jwt.sign({
        aud: "jitsi",
        iss: "chat",
        sub: JAAS_APP_ID,
        room: roomName,
        nbf: now - 10,
        exp: now + 3600,
        context: {
            user: {
                id: String(userId),
                name: userName,
                moderator
            }
        }
    }, PRIVATE_KEY, {
        algorithm: "RS256",
        header: {
            kid: JAAS_KEY_ID,
            typ: "JWT"
        }
    });
}

// =====================================
// STUDENT JITSI TOKEN
// =====================================

app.post("/api/jitsi-token", async (req, res) => {
    try {
        const student = await getLoggedInStudent(req);

        if (!student) {
            return res.status(401).json({
                success: false,
                message: "Please login first."
            });
        }

        const roomName = `ucs-academy-class-${student.class_name}`;

        const token = createJitsiToken(
            student.roll_number,
            student.name,
            roomName,
            false
        );

        return res.json({
            success: true,
            token,
            roomName
        });

    } catch (error) {
        console.error("Student Jitsi Token Error:", error);
        return res.status(500).json({
            success: false,
            message: "Jitsi token could not be created."
        });
    }
});

// =====================================
// STUDENT LOGOUT
// =====================================

app.post("/api/logout", async (req, res) => {
    try {
        if (req.session.studentRoll && req.session.studentClass) {
            await pool.query(
                `UPDATE students
                 SET active_session_id = NULL
                 WHERE roll_number = $1
                   AND class_name = $2
                   AND active_session_id = $3`,
                [
                    req.session.studentRoll,
                    req.session.studentClass,
                    req.sessionID
                ]
            );
        }

        await destroySession(req);
        res.clearCookie("ucs.sid", { path: "/" });

        return res.json({
            success: true,
            message: "Logout successful."
        });

    } catch (error) {
        console.error("Student Logout Error:", error);
        return res.status(500).json({
            success: false,
            message: "Logout failed."
        });
    }
});

// =====================================
// TEACHER LOGIN
// =====================================

app.post("/api/teacher-login", async (req, res) => {
    try {
        const username = typeof req.body.username === "string"
            ? req.body.username.trim()
            : "";

        const password = typeof req.body.password === "string"
            ? req.body.password
            : "";

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username aur password bharo."
            });
        }

        const result = await pool.query(
            `SELECT *
             FROM teachers
             WHERE username = $1
             LIMIT 1`,
            [username]
        );

        const teacher = result.rows[0];

        if (!teacher) {
            return res.status(401).json({
                success: false,
                message: "Teacher details galat hain."
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            teacher.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Teacher details galat hain."
            });
        }

        const teacherClass = String(teacher.class_name);

        if (!ALLOWED_CLASSES.includes(teacherClass)) {
            return res.status(403).json({
                success: false,
                message: "Teacher class is not configured."
            });
        }

        await regenerateSession(req);
        req.session.teacherUsername = teacher.username;

        await pool.query(
            `UPDATE teachers
             SET active_session_id = $1
             WHERE username = $2`,
            [req.sessionID, teacher.username]
        );

        try {
            await saveSession(req);
        } catch (error) {
            await pool.query(
                `UPDATE teachers
                 SET active_session_id = NULL
                 WHERE username = $1 AND active_session_id = $2`,
                [teacher.username, req.sessionID]
            );
            throw error;
        }

        return res.json({
            success: true,
            message: "Teacher login successful!",
            teacher: {
                name: teacher.name,
                username: teacher.username,
                class_name: teacherClass
            }
        });

    } catch (error) {
        console.error("Teacher Login Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error."
        });
    }
});

// =====================================
// TEACHER SESSION CHECK
// =====================================

app.get("/api/teacher-me", async (req, res) => {
    try {
        if (!req.session.teacherUsername) {
            return res.status(401).json({
                success: false,
                message: "Teacher login required."
            });
        }

        const result = await pool.query(
            `SELECT name, username, class_name, active_session_id
             FROM teachers
             WHERE username = $1
             LIMIT 1`,
            [req.session.teacherUsername]
        );

        const teacher = result.rows[0];

        if (!teacher || teacher.active_session_id !== req.sessionID) {
            await destroySession(req);
            res.clearCookie("ucs.sid", { path: "/" });

            return res.status(401).json({
                success: false,
                message: "Invalid teacher session."
            });
        }

        return res.json({
            success: true,
            teacher: {
                name: teacher.name,
                username: teacher.username,
                class_name: String(teacher.class_name)
            }
        });

    } catch (error) {
        console.error("Teacher Session Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error."
        });
    }
});

// =====================================
// TEACHER JITSI TOKEN
// =====================================

app.post("/api/teacher-jitsi-token", async (req, res) => {
    try {
        if (!req.session.teacherUsername) {
            return res.status(401).json({
                success: false,
                message: "Teacher login required."
            });
        }

        const result = await pool.query(
            `SELECT name, username, class_name, active_session_id
             FROM teachers
             WHERE username = $1
             LIMIT 1`,
            [req.session.teacherUsername]
        );

        const teacher = result.rows[0];

        if (!teacher || teacher.active_session_id !== req.sessionID) {
            return res.status(401).json({
                success: false,
                message: "Invalid teacher session."
            });
        }

        const teacherClass = String(teacher.class_name);

        if (!ALLOWED_CLASSES.includes(teacherClass)) {
            return res.status(403).json({
                success: false,
                message: "Teacher class is not configured."
            });
        }

        const roomName = `ucs-academy-class-${teacherClass}`;

        const token = createJitsiToken(
            teacher.username,
            teacher.name,
            roomName,
            true
        );

        return res.json({
            success: true,
            token,
            roomName
        });

    } catch (error) {
        console.error("Teacher Jitsi Token Error:", error);
        return res.status(500).json({
            success: false,
            message: "Teacher live class token could not be created."
        });
    }
});

// =====================================
// TEACHER LOGOUT
// =====================================

app.post("/api/teacher-logout", async (req, res) => {
    try {
        if (req.session.teacherUsername) {
            await pool.query(
                `UPDATE teachers
                 SET active_session_id = NULL
                 WHERE username = $1 AND active_session_id = $2`,
                [req.session.teacherUsername, req.sessionID]
            );
        }

        await destroySession(req);
        res.clearCookie("ucs.sid", { path: "/" });

        return res.json({
            success: true,
            message: "Teacher logout successful."
        });

    } catch (error) {
        console.error("Teacher Logout Error:", error);
        return res.status(500).json({
            success: false,
            message: "Teacher logout failed."
        });
    }
});

// =====================================
// 404 HANDLER
// =====================================

app.use((req, res) => {
    res.status(404).send("404 - Page Not Found");
});

// =====================================
// START SERVER
// =====================================

const server = app.listen(PORT, () => {
    console.log("------------------------------------");
    console.log("       UCS ACADEMY SERVER");
    console.log("------------------------------------");
    console.log(`Server running at http://localhost:${PORT}`);
    console.log("PostgreSQL Database Connected");
    console.log("PostgreSQL Session Store Ready");
    console.log("Student and Teacher Login Ready");
    console.log("Jitsi Live Classes Ready");
    console.log("------------------------------------");
});

server.on("error", (error) => {
    console.error("Server startup error:", error);
});

async function shutdown() {
    console.log("Shutting down UCS ACADEMY server...");
    server.close(async () => {
        try {
            await pool.end();
            process.exit(0);
        } catch (error) {
            console.error("Error closing PostgreSQL pool:", error);
            process.exit(1);
        }
    });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
