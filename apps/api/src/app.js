const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const db = require("./db");
const authRoutes = require("./routes/auth");
const employeeRoutes = require("./routes/employees");
const { authenticate } = require("./middleware/auth");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/me", authenticate, async (req, res) => {
  const result = await db.query(
    `SELECT employees.id,
            users.card_id,
            employees.full_name,
            users.role,
            employees.department,
            employees.position,
            employees.created_at
     FROM employees
     JOIN users ON users.id = employees.user_id
     WHERE users.id = $1`,
    [req.user.id]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ message: "Employee not found." });
  }

  return res.json(result.rows[0]);
});

app.use("/auth", authRoutes);
app.use("/employees", employeeRoutes);

app.use((err, _req, res, _next) => {
  res.status(500).json({ message: "Unexpected server error.", error: err.message });
});

module.exports = app;
