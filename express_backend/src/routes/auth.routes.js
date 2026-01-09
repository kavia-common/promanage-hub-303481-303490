const express = require("express");

const { register, login, refresh, logout, me } = require("../controllers/auth.controller");
const { verifyAccessToken } = require("../middleware/auth");

const router = express.Router();

/**
 * Auth routes (JWT):
 * - POST /api/v1/auth/register
 * - POST /api/v1/auth/login
 * - POST /api/v1/auth/refresh
 * - POST /api/v1/auth/logout
 * - GET  /api/v1/auth/me
 */

// PUBLIC_INTERFACE
router.post("/register", register);

// PUBLIC_INTERFACE
router.post("/login", login);

// PUBLIC_INTERFACE
router.post("/refresh", refresh);

// PUBLIC_INTERFACE
router.post("/logout", logout);

// PUBLIC_INTERFACE
router.get("/me", verifyAccessToken, me);

module.exports = router;
