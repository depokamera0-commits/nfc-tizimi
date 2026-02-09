const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const db = require("../db");

const login = async (req, res) => {
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

  const user = result.rows[0];
  const match = await bcrypt.compare(pin, user.pin_hash);
  if (!match) {
    return res.status(401).json({ message: "Invalid card ID or PIN." });
  }

  const token = jwt.sign(
    {
      id: user.user_id,
      role: user.role,
      cardId: user.card_id,
      fullName: user.full_name,
      employeeId: user.employee_id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  return res.json({
    token,
    employee: {
      id: user.employee_id,
      cardId: user.card_id,
      role: user.role,
      fullName: user.full_name,
    },
  });
};

module.exports = {
  login,
};
