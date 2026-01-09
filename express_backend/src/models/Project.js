const mongoose = require("mongoose");

const { Schema } = mongoose;

const PROJECT_MEMBER_ROLES = ["admin", "member"];

const projectMemberSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: PROJECT_MEMBER_ROLES, default: "member", required: true }
  },
  { _id: false }
);

const projectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, trim: true, uppercase: true },
    description: { type: String, default: "", trim: true },

    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    members: { type: [projectMemberSchema], default: [] },

    isArchived: { type: Boolean, default: false, index: true },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  {
    // timestamps + toJSON transform are applied via global baseSchemaPlugin
  }
);

// Unique key per project (global uniqueness as requested)
projectSchema.index({ key: 1 }, { unique: true });

const Project = mongoose.models.Project || mongoose.model("Project", projectSchema);

module.exports = { Project, PROJECT_MEMBER_ROLES };

