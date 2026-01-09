const mongoose = require("mongoose");

const { Schema } = mongoose;

const TASK_PRIORITIES = ["low", "medium", "high", "critical"];

const taskSubTaskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false }
  },
  { _id: false }
);

const taskAttachmentSchema = new Schema(
  {
    name: { type: String, trim: true },
    url: { type: String, trim: true },
    mimeType: { type: String, trim: true },
    size: { type: Number }
  },
  { _id: false }
);

const taskSchema = new Schema(
  {
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },

    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },

    status: { type: Schema.Types.ObjectId, ref: "WorkflowStatus", required: true, index: true },
    assignee: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },

    priority: { type: String, enum: TASK_PRIORITIES, default: "medium", index: true },

    labels: { type: [String], default: [] },

    dueDate: { type: Date, default: null },

    attachments: { type: [taskAttachmentSchema], default: [] },

    estimate: { type: Number, default: null },

    subTasks: { type: [taskSubTaskSchema], default: [] },

    isDeleted: { type: Boolean, default: false, index: true }
  },
  {
    // timestamps + toJSON transform are applied via global baseSchemaPlugin
  }
);

// Text search over title + description
taskSchema.index({ title: "text", description: "text" });

// Compound indexes for common queries/filters
taskSchema.index({ project: 1, status: 1, assignee: 1, priority: 1 });

const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);

module.exports = { Task, TASK_PRIORITIES };

