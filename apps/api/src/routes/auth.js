const express = require("express");
const { body } = require("express-validator");
const { login } = require("../controllers/authController");

const router = express.Router();

router.post(
  "/login",
  [
    body("cardId").trim().notEmpty().withMessage("cardId is required"),
    body("pin").trim().notEmpty().withMessage("pin is required"),
  ],
  login
);

module.exports = router;
