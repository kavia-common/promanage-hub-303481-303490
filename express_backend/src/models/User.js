const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const { Schema } = mongoose;

const USER_ROLES = ["admin", "member"];

/**
 * User schema:
 * - email unique (lowercased, trimmed)
 * - name
 * - role enum
 * - passwordHash stored in DB; password set via virtual
 * - lastLogin
 * - isActive
 */
const userSchema = new Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: USER_ROLES, default: "member", index: true },
    passwordHash: { type: String, required: true, select: false },
    lastLogin: { type: Date, default: null },
    isActive: { type: Boolean, default: true }
  },
  {
    // timestamps + toJSON transform are applied via global baseSchemaPlugin
  }
);

// Unique email index (case-insensitive handled by lowercasing)
userSchema.index({ email: 1 }, { unique: true });

// Virtual setter for password; stores plain password temporarily for hashing.
userSchema
  .virtual("password")
  .set(function setPassword(password) {
    this._plainPassword = password;
  })
  .get(function getPassword() {
    return this._plainPassword;
  });

/**
 * Pre-save hook:
 * - If password was set through the virtual, hash it into passwordHash.
 */
userSchema.pre("save", async function userPreSave(next) {
  try {
    if (this._plainPassword) {
      const saltRounds = 12;
      this.passwordHash = await bcrypt.hash(String(this._plainPassword), saltRounds);
      this._plainPassword = undefined;
    }
    return next();
  } catch (err) {
    return next(err);
  }
});

// PUBLIC_INTERFACE
userSchema.methods.verifyPassword = async function verifyPassword(plainPassword) {
  /** Verifies a plain password against the stored hash. */
  return bcrypt.compare(String(plainPassword), this.passwordHash);
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = { User, USER_ROLES };

