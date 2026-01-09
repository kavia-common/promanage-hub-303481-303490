const express = require("express");

const router = express.Router();

/**
 * Placeholder auth routes.
 * Later steps will implement: register, login, refresh, logout, me.
 */
router.get("/", (req, res) => {
  res.json({ success: true, message: "Auth routes placeholder" });
});

module.exports = router;
