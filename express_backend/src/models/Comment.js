const mongoose = require("mongoose");

const { Schema } = mongoose;

const commentSchema = new Schema(
  {
    task: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true },
    mentions: { type: [Schema.Types.ObjectId], ref: "User", default: [] }
  },
  {
    // timestamps + toJSON transform are applied via global baseSchemaPlugin
    // NOTE: we also keep an explicit createdAt index as requested.
  }
);

commentSchema.index({ task: 1, createdAt: 1 });

const Comment = mongoose.models.Comment || mongoose.model("Comment", commentSchema);

module.exports = { Comment };

