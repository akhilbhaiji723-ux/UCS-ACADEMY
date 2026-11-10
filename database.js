
const Database = require("better-sqlite3");

const db = new Database("students.db");

// =====================================
// UCS ACADEMY - DATABASE
// =====================================

function createStudentsTable(tableName = "students") {
    db.exec(`
        CREATE TABLE ${tableName} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            roll_number TEXT NOT NULL,
            dob TEXT NOT NULL,
            class_name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            active_session_id TEXT,
            UNIQUE(roll_number, class_name)
        );
    `);
}

const existingTable = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type = 'table' AND name = 'students'
`).get();

if (!existingTable) {

    createStudentsTable();

} else {

    const indexes = db.pragma("index_list('students')");

    let hasRollOnlyUnique = false;
    let hasClassRollUnique = false;

    for (const index of indexes) {

        if (!index.unique) continue;

        const columns = db.pragma(
            `index_info('${index.name.replace(/'/g, "''")}')`
        ).map(column => column.name);

        if (
            columns.length === 1 &&
            columns[0] === "roll_number"
        ) {
            hasRollOnlyUnique = true;
        }

        if (
            columns.length === 2 &&
            columns.includes("roll_number") &&
            columns.includes("class_name")
        ) {
            hasClassRollUnique = true;
        }
    }

    // Migrate old database without deleting student records.
    if (hasRollOnlyUnique || !hasClassRollUnique) {

        const migrateStudents = db.transaction(() => {

            db.exec("DROP TABLE IF EXISTS students_new");

            createStudentsTable("students_new");

            db.exec(`
                INSERT INTO students_new (
                    id,
                    name,
                    roll_number,
                    dob,
                    class_name,
                    password_hash,
                    active_session_id
                )
                SELECT
                    id,
                    name,
                    roll_number,
                    dob,
                    class_name,
                    password_hash,
                    active_session_id
                FROM students;
            `);

            db.exec("DROP TABLE students");

            db.exec(`
                ALTER TABLE students_new
                RENAME TO students;
            `);
        });

        migrateStudents();

        console.log("Student database migration completed!");
    }
}

// =====================================
// TEACHERS TABLE
// =====================================

db.exec(`
    CREATE TABLE IF NOT EXISTS teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        class_name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        active_session_id TEXT
    );
`);

console.log("Student and Teacher Database Ready!");

module.exports = db;
