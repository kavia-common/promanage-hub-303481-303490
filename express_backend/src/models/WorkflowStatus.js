const mongoose = require("mongoose");

const { Schema } = mongoose;

const workflowStatusSchema = new Schema(
  {
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    name: { type: String, required: true, trim: true },
    order: { type: Number, required: true },
    isDefault: { type: Boolean, default: false }
  },
  {
    // timestamps + toJSON transform are applied via global baseSchemaPlugin
  }
);

// Keep column ordering efficient per project
workflowStatusSchema.index({ project: 1, order: 1 });

const WorkflowStatus =
  mongoose.models.WorkflowStatus || mongoose.model("WorkflowStatus", workflowStatusSchema);

module.exports = { WorkflowStatus };

