const express = require("express");

const router = express.Router();

/**
 * Placeholder activity log routes.
 * Later: list activity by project/task/user, audit trail.
 */
router.get("/", (req, res) => {
  res.json({ success: true, message: "Activity routes placeholder" });
});

module.exports = router;
