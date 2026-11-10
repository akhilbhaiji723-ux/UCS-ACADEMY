
const { Pool } = require("pg");

// =====================================
// UCS ACADEMY - NEON POSTGRESQL CONNECTION
// =====================================

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Please check your .env file.");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,

    // Neon PostgreSQL SSL connection
    ssl: {
        rejectUnauthorized: false
    },

    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});

// Connection error handling
pool.on("error", (err) => {
    console.error("Unexpected PostgreSQL error:", err.message);
});

module.exports = pool;
