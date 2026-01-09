const mongoose = require("mongoose");

const { Schema } = mongoose;

/**
 * RefreshToken model
 * Stores refresh tokens so they can be revoked on logout and validated on refresh.
 *
 * Notes:
 * - tokens are stored hashed (sha256) to reduce impact of DB leakage.
 * - we keep expiry in DB for cleanup / invalidation checks.
 */
const refreshTokenSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // sha256(token) - never store raw token
    tokenHash: { type: String, required: true, unique: true, index: true },

    revokedAt: { type: Date, default: null },

    expiresAt: { type: Date, required: true, index: true }
  },
  {
    // timestamps + toJSON transform are applied via global baseSchemaPlugin
  }
);

// Auto-expire documents after expiresAt
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken =
  mongoose.models.RefreshToken || mongoose.model("RefreshToken", refreshTokenSchema);

module.exports = { RefreshToken };
