const express = require("express");

const router = express.Router();

/**
 * Placeholder tasks routes.
 * Later: CRUD tasks, assignments, due dates, labels, search/filter.
 */
router.get("/", (req, res) => {
  res.json({ success: true, message: "Tasks routes placeholder" });
});

module.exports = router;
