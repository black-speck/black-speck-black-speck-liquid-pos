const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: "postgresql://postgres:gmIyRXdOMvamFRHoNHwmJWgryyuEgBuj@switchyard.proxy.rlwy.net:48449/railway",
  ssl: { rejectUnauthorized: false },
});

pool.connect()
  .then(() => console.log("✅ PostgreSQL connected"))
  .catch(err => console.error("❌ DB error:", err.message));

module.exports = pool;