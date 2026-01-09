const express = require("express");

const router = express.Router();

/**
 * Placeholder workflow statuses routes.
 * Later: CRUD statuses per project, ordering, Kanban columns.
 */
router.get("/", (req, res) => {
  res.json({ success: true, message: "Statuses routes placeholder" });
});

module.exports = router;
