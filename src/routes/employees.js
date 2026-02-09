const express = require("express");
const bcrypt = require("bcryptjs");
const { body, param, validationResult } = require("express-validator");
const db = require("../db");
const { authenticate } = require("../middleware/auth");
const { requireRoles } = require("../middleware/roles");

const router = express.Router();

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
};

router.get("/me", authenticate, async (req, res) => {
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

router.get(
  "/",
  authenticate,
  requireRoles("admin", "hr"),
  async (_req, res) => {
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
       ORDER BY employees.id`
    );
    return res.json(result.rows);
  }
);

router.get(
  "/:id",
  authenticate,
  requireRoles("admin", "hr"),
  [param("id").isInt()],
  async (req, res) => {
    if (!validate(req, res)) return null;
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
       WHERE employees.id = $1`,
      [req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Employee not found." });
    }
    return res.json(result.rows[0]);
  }
);

router.post(
  "/",
  authenticate,
  requireRoles("admin", "hr"),
  [
    body("cardId").trim().notEmpty(),
    body("pin").trim().isLength({ min: 4 }),
    body("fullName").trim().notEmpty(),
    body("role").isIn(["admin", "hr", "manager", "employee"]),
    body("department").optional().trim(),
    body("position").optional().trim(),
  ],
  async (req, res) => {
    if (!validate(req, res)) return null;
    const { cardId, pin, fullName, role, department, position } = req.body;
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      const pinHash = await bcrypt.hash(pin, 10);
      const userResult = await client.query(
        `INSERT INTO users (card_id, pin_hash, role)
         VALUES ($1, $2, $3)
         RETURNING id, card_id, role, created_at`,
        [cardId, pinHash, role]
      );
      const employeeResult = await client.query(
        `INSERT INTO employees (user_id, full_name, department, position)
         VALUES ($1, $2, $3, $4)
         RETURNING id, full_name, department, position, created_at`,
        [
          userResult.rows[0].id,
          fullName,
          department || null,
          position || null,
        ]
      );
      await client.query("COMMIT");
      return res.status(201).json({
        id: employeeResult.rows[0].id,
        card_id: userResult.rows[0].card_id,
        full_name: employeeResult.rows[0].full_name,
        role: userResult.rows[0].role,
        department: employeeResult.rows[0].department,
        position: employeeResult.rows[0].position,
        created_at: employeeResult.rows[0].created_at,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
);

router.put(
  "/:id",
  authenticate,
  requireRoles("admin", "hr"),
  [
    param("id").isInt(),
    body("fullName").optional().trim().notEmpty(),
    body("role").optional().isIn(["admin", "hr", "manager", "employee"]),
    body("department").optional().trim(),
    body("position").optional().trim(),
    body("pin").optional().trim().isLength({ min: 4 }),
  ],
  async (req, res) => {
    if (!validate(req, res)) return null;
    const { fullName, role, department, position, pin } = req.body;

    const employeeFields = [];
    const employeeValues = [];
    let employeeIdx = 1;

    if (fullName) {
      employeeFields.push(`full_name = $${employeeIdx++}`);
      employeeValues.push(fullName);
    }
    if (department !== undefined) {
      employeeFields.push(`department = $${employeeIdx++}`);
      employeeValues.push(department);
    }
    if (position !== undefined) {
      employeeFields.push(`position = $${employeeIdx++}`);
      employeeValues.push(position);
    }

    const userFields = [];
    const userValues = [];
    let userIdx = 1;

    if (role) {
      userFields.push(`role = $${userIdx++}`);
      userValues.push(role);
    }
    if (pin) {
      const pinHash = await bcrypt.hash(pin, 10);
      userFields.push(`pin_hash = $${userIdx++}`);
      userValues.push(pinHash);
    }

    if (employeeFields.length === 0 && userFields.length === 0) {
      return res.status(400).json({ message: "No fields to update." });
    }

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      const employeeResult = await client.query(
        "SELECT user_id FROM employees WHERE id = $1",
        [req.params.id]
      );
      if (employeeResult.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Employee not found." });
      }
      const userId = employeeResult.rows[0].user_id;

      if (employeeFields.length > 0) {
        employeeValues.push(req.params.id);
        await client.query(
          `UPDATE employees SET ${employeeFields.join(", ")} WHERE id = $${
            employeeFields.length + 1
          }`,
          employeeValues
        );
      }

      if (userFields.length > 0) {
        userValues.push(userId);
        await client.query(
          `UPDATE users SET ${userFields.join(", ")} WHERE id = $${
            userFields.length + 1
          }`,
          userValues
        );
      }

      const result = await client.query(
        `SELECT employees.id,
                users.card_id,
                employees.full_name,
                users.role,
                employees.department,
                employees.position,
                employees.created_at
         FROM employees
         JOIN users ON users.id = employees.user_id
         WHERE employees.id = $1`,
        [req.params.id]
      );
      await client.query("COMMIT");
      return res.json(result.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
);

router.delete(
  "/:id",
  authenticate,
  requireRoles("admin"),
  [param("id").isInt()],
  async (req, res) => {
    if (!validate(req, res)) return null;
    const result = await db.query(
      `DELETE FROM users
       WHERE id = (SELECT user_id FROM employees WHERE id = $1)`,
      [req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Employee not found." });
    }
    return res.status(204).send();
  }
);

module.exports = router;
