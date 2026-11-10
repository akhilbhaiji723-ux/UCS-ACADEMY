
require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function setupDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS students (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                roll_number TEXT NOT NULL,
                dob TEXT NOT NULL,
                class_name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                active_session_id TEXT,
                UNIQUE (roll_number, class_name)
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS teachers (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                username TEXT NOT NULL UNIQUE,
                class_name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                active_session_id TEXT
            );
        `);

        console.log("SUCCESS: Students table created.");
        console.log("SUCCESS: Teachers table created.");
        console.log("UCS ACADEMY PostgreSQL database is ready.");

    } catch (error) {
        console.error("DATABASE ERROR:", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

setupDatabase();
