const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const db = require("../db");

const router = express.Router();

router.post(
  "/login",
  [
    body("cardId").trim().notEmpty().withMessage("cardId is required"),
    body("pin").trim().notEmpty().withMessage("pin is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { cardId, pin } = req.body;
    const result = await db.query(
      `SELECT users.id AS user_id,
              users.card_id,
              users.pin_hash,
              users.role,
              employees.id AS employee_id,
              employees.full_name
       FROM users
       JOIN employees ON employees.user_id = users.id
       WHERE users.card_id = $1`,
      [cardId]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ message: "Invalid card ID or PIN." });
    }

    const employee = result.rows[0];
    const match = await bcrypt.compare(pin, employee.pin_hash);
    if (!match) {
      return res.status(401).json({ message: "Invalid card ID or PIN." });
    }

    const token = jwt.sign(
      {
        id: employee.user_id,
        role: employee.role,
        cardId: employee.card_id,
        fullName: employee.full_name,
        employeeId: employee.employee_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      token,
      employee: {
        id: employee.employee_id,
        cardId: employee.card_id,
        role: employee.role,
        fullName: employee.full_name,
      },
    });
  }
);

module.exports = router;
