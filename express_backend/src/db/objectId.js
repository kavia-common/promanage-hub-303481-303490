const mongoose = require("mongoose");

// PUBLIC_INTERFACE
function isValidObjectId(value) {
  /** Returns true if the provided value is a valid MongoDB ObjectId representation. */
  if (value == null) return false;
  return mongoose.isValidObjectId(value);
}

module.exports = { isValidObjectId };

