
require("dotenv").config();

const SQLite = require("better-sqlite3");
const { Pool } = require("pg");

const oldDb = new SQLite("./students.db", {
    readonly: true,
    fileMustExist: true
});

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    const client = await pool.connect();

    try {
        const students = oldDb.prepare(
            "SELECT name, roll_number, dob, class_name, password_hash FROM students"
        ).all();

        const teachers = oldDb.prepare(
            "SELECT name, username, class_name, password_hash FROM teachers"
        ).all();

        await client.query("BEGIN");

        for (const s of students) {
            await client.query(
                `INSERT INTO students
                (name, roll_number, dob, class_name, password_hash)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (roll_number, class_name)
                DO UPDATE SET
                    name = EXCLUDED.name,
                    dob = EXCLUDED.dob,
                    password_hash = EXCLUDED.password_hash`,
                [s.name, s.roll_number, s.dob, s.class_name, s.password_hash]
            );
        }

        for (const t of teachers) {
            await client.query(
                `INSERT INTO teachers
                (name, username, class_name, password_hash)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (username)
                DO UPDATE SET
                    name = EXCLUDED.name,
                    class_name = EXCLUDED.class_name,
                    password_hash = EXCLUDED.password_hash`,
                [t.name, t.username, t.class_name, t.password_hash]
            );
        }

        await client.query("COMMIT");

        console.log("STUDENTS MIGRATED:", students.length);
        console.log("TEACHERS MIGRATED:", teachers.length);
        console.log("DATABASE MIGRATION SUCCESSFUL!");

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("MIGRATION ERROR:", error.message);
        process.exitCode = 1;

    } finally {
        client.release();
        oldDb.close();
        await pool.end();
    }
}

migrate();
