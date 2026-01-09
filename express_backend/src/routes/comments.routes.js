const express = require("express");

const router = express.Router();

/**
 * Placeholder comments routes.
 * Later: CRUD comments by task, mentions, notifications.
 */
router.get("/", (req, res) => {
  res.json({ success: true, message: "Comments routes placeholder" });
});

module.exports = router;
