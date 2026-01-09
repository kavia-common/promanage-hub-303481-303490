# express_backend

Production-ready Express backend skeleton for the Promanage Hub (Mini Jira) application.

## Requirements
- Node.js 18+ recommended
- npm

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a local env file:
   ```bash
   cp .env.example .env
   ```

3. Run in development:
   ```bash
   npm run dev
   ```

4. Run in production mode:
   ```bash
   npm start
   ```

## Environment variables

Required / supported keys:

- `NODE_ENV` (development|test|production)
- `PORT` (number)
- `MONGODB_URI` (Mongo connection string; will be used in later steps when DB connection is implemented)
- `JWT_SECRET` (secret for signing JWTs; will be used in later steps when auth is implemented)
- `CORS_ORIGIN` (optional; in development if unset, CORS is permissive)

## API
- `GET /health` -> `{ "status": "ok" }`
- `GET /api/v1/auth` (placeholder)
- `GET /api/v1/projects` (placeholder)
- `GET /api/v1/tasks` (placeholder)
- `GET /api/v1/statuses` (placeholder)
- `GET /api/v1/comments` (placeholder)
- `GET /api/v1/activity` (placeholder)

## Notes
- Database connection (mongoose), models, JWT auth/RBAC, and full REST APIs will be implemented in subsequent subtasks.
- Error responses are standardized:
  ```json
  { "success": false, "message": "...", "code": "...", "details": {} }
  ```
"""
