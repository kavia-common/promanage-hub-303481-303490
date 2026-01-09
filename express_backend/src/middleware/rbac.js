const { AppError } = require("../utils/AppError");
const { isValidObjectId } = require("../db/objectId");
const { Project } = require("../models");

/**
 * RBAC helpers:
 * - requireRole(['admin'])
 * - requireProjectMember({ projectIdSource, allowedProjectRoles })
 *
 * Conventions:
 * - global user roles are lowercased in User model: admin/member
 * - project member roles are lowercased in Project model: admin/member
 */

// PUBLIC_INTERFACE
function requireRole(roles = []) {
  /** Returns middleware that requires the authenticated user to have one of the specified global roles. */
  const required = roles.map((r) => String(r).toLowerCase());

  return (req, res, next) => {
    if (!req.user) return next(new AppError("Authentication required", 401, "AUTH_REQUIRED"));

    if (!required.includes(String(req.user.role).toLowerCase())) {
      return next(new AppError("Forbidden", 403, "FORBIDDEN"));
    }

    return next();
  };
}

// PUBLIC_INTERFACE
function requireProjectMember(options = {}) {
  /**
   * Returns middleware that ensures the authenticated user is a member of the target project.
   *
   * @param {object} [options]
   * @param {"params"|"body"} [options.projectIdFrom="params"] Where to read projectId from.
   * @param {string} [options.projectIdKey="projectId"] Key name used in params/body.
   * @param {string[]} [options.allowedProjectRoles=["admin","member"]] Allowed roles within project membership.
   */
  const {
    projectIdFrom = "params",
    projectIdKey = "projectId",
    allowedProjectRoles = ["admin", "member"]
  } = options;

  const allowed = allowedProjectRoles.map((r) => String(r).toLowerCase());

  return async (req, res, next) => {
    try {
      if (!req.user) return next(new AppError("Authentication required", 401, "AUTH_REQUIRED"));

      const projectId =
        projectIdFrom === "body"
          ? req.body?.[projectIdKey]
          : req.params?.[projectIdKey] || req.params?.id;

      if (!projectId || !isValidObjectId(projectId)) {
        return next(new AppError("Invalid projectId", 400, "VALIDATION_ERROR", { projectId }));
      }

      const project = await Project.findById(projectId).select("owner members isArchived");
      if (!project) {
        return next(new AppError("Project not found", 404, "PROJECT_NOT_FOUND"));
      }
      if (project.isArchived) {
        return next(new AppError("Project is archived", 403, "PROJECT_ARCHIVED"));
      }

      const userId = String(req.user.id || req.user._id);

      // Owner always treated as project admin
      if (String(project.owner) === userId) {
        req.project = project;
        req.projectRole = "admin";
        return next();
      }

      const member = (project.members || []).find((m) => String(m.user) === userId);
      if (!member) {
        return next(new AppError("Not a project member", 403, "PROJECT_MEMBER_REQUIRED"));
      }

      const projectRole = String(member.role || "member").toLowerCase();
      if (!allowed.includes(projectRole)) {
        return next(new AppError("Insufficient project role", 403, "PROJECT_ROLE_FORBIDDEN"));
      }

      req.project = project;
      req.projectRole = projectRole;

      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = { requireRole, requireProjectMember };
