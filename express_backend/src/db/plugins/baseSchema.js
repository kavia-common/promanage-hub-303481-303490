const mongoose = require("mongoose");

/**
 * Shared schema plugin:
 * - enables timestamps
 * - ensures clean JSON serialization
 * - provides consistent `id` field
 */
function baseSchemaPlugin(schema) {
  // Ensure timestamps are enabled unless explicitly set by the schema author.
  if (!schema.options.timestamps) {
    schema.set("timestamps", true);
  }

  // Preserve any existing transform function.
  const existingToJSON = schema.options.toJSON || {};
  const existingTransform = existingToJSON.transform;

  schema.set("toJSON", {
    virtuals: true,
    getters: false,
    ...existingToJSON,
    transform(doc, ret, options) {
      // Allow upstream transform to run first.
      if (typeof existingTransform === "function") {
        ret = existingTransform(doc, ret, options) || ret;
      }

      // Normalize id field
      if (ret && ret._id != null) {
        ret.id = String(ret._id);
      }

      // Remove Mongo internals
      delete ret._id;
      delete ret.__v;

      return ret;
    }
  });
}

module.exports = { baseSchemaPlugin };

