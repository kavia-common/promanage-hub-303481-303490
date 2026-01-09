const express = require("express");

const router = express.Router();

/**
 * Placeholder projects routes.
 * Later: CRUD projects, members, dashboard stats, filtering/search.
 */
router.get("/", (req, res) => {
  res.json({ success: true, message: "Projects routes placeholder" });
});

module.exports = router;
