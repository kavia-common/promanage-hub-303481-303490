const express = require("express");

const authRouter = require("./auth.routes");
const projectsRouter = require("./projects.routes");
const tasksRouter = require("./tasks.routes");
const statusesRouter = require("./statuses.routes");
const commentsRouter = require("./comments.routes");
const activityRouter = require("./activity.routes");

const router = express.Router();

router.use("/auth", authRouter);
router.use("/projects", projectsRouter);
router.use("/tasks", tasksRouter);
router.use("/statuses", statusesRouter);
router.use("/comments", commentsRouter);
router.use("/activity", activityRouter);

module.exports = router;
