const mongoose = require("mongoose");

const { Schema } = mongoose;

const ACTIVITY_TYPES = [
  "task_created",
  "task_updated",
  "task_moved",
  "comment_added",
  "status_added",
  "status_updated"
];

const activityLogSchema = new Schema(
  {
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    task: { type: Schema.Types.ObjectId, ref: "Task", default: null, index: true },
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true },

    type: { type: String, enum: ACTIVITY_TYPES, required: true },

    meta: { type: Schema.Types.Mixed, default: {} }
  },
  {
    // timestamps + toJSON transform are applied via global baseSchemaPlugin
  }
);

activityLogSchema.index({ project: 1, createdAt: 1 });
activityLogSchema.index({ task: 1, createdAt: 1 });

const ActivityLog = mongoose.models.ActivityLog || mongoose.model("ActivityLog", activityLogSchema);

module.exports = { ActivityLog, ACTIVITY_TYPES };

