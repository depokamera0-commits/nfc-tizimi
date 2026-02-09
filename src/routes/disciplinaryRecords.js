const express = require("express");
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
    `SELECT id, employee_id, action_date, action_type, notes, created_by, created_at
     FROM disciplinary_records WHERE employee_id = $1 ORDER BY action_date DESC`,
    [req.user.id]
  );
  return res.json(result.rows);
});

router.get(
  "/",
  authenticate,
  requireRoles("admin", "hr", "manager"),
  async (_req, res) => {
    const result = await db.query(
      `SELECT id, employee_id, action_date, action_type, notes, created_by, created_at
       FROM disciplinary_records ORDER BY action_date DESC`
    );
    return res.json(result.rows);
  }
);

router.get(
  "/:id",
  authenticate,
  requireRoles("admin", "hr", "manager"),
  [param("id").isInt()],
  async (req, res) => {
    if (!validate(req, res)) return null;
    const result = await db.query(
      `SELECT id, employee_id, action_date, action_type, notes, created_by, created_at
       FROM disciplinary_records WHERE id = $1`,
      [req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Disciplinary record not found." });
    }
    return res.json(result.rows[0]);
  }
);

router.post(
  "/",
  authenticate,
  requireRoles("admin", "hr"),
  [
    body("employeeId").isInt(),
    body("actionDate").isISO8601(),
    body("actionType").trim().notEmpty(),
    body("notes").optional().trim(),
  ],
  async (req, res) => {
    if (!validate(req, res)) return null;
    const { employeeId, actionDate, actionType, notes } = req.body;
    const result = await db.query(
      `INSERT INTO disciplinary_records (employee_id, action_date, action_type, notes, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, employee_id, action_date, action_type, notes, created_by, created_at`,
      [employeeId, actionDate, actionType, notes || null, req.user.id]
    );
    return res.status(201).json(result.rows[0]);
  }
);

router.put(
  "/:id",
  authenticate,
  requireRoles("admin", "hr"),
  [
    param("id").isInt(),
    body("actionDate").optional().isISO8601(),
    body("actionType").optional().trim().notEmpty(),
    body("notes").optional().trim(),
  ],
  async (req, res) => {
    if (!validate(req, res)) return null;
    const { actionDate, actionType, notes } = req.body;
    const fields = [];
    const values = [];
    let idx = 1;

    if (actionDate) {
      fields.push(`action_date = $${idx++}`);
      values.push(actionDate);
    }
    if (actionType) {
      fields.push(`action_type = $${idx++}`);
      values.push(actionType);
    }
    if (notes !== undefined) {
      fields.push(`notes = $${idx++}`);
      values.push(notes);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "No fields to update." });
    }

    values.push(req.params.id);
    const result = await db.query(
      `UPDATE disciplinary_records SET ${fields.join(", ")} WHERE id = $${idx}
       RETURNING id, employee_id, action_date, action_type, notes, created_by, created_at`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Disciplinary record not found." });
    }
    return res.json(result.rows[0]);
  }
);

router.delete(
  "/:id",
  authenticate,
  requireRoles("admin", "hr"),
  [param("id").isInt()],
  async (req, res) => {
    if (!validate(req, res)) return null;
    const result = await db.query(
      "DELETE FROM disciplinary_records WHERE id = $1",
      [req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Disciplinary record not found." });
    }
    return res.status(204).send();
  }
);

module.exports = router;
