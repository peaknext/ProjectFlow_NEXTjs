# ProjectFlow API Documentation

API Routes structure for ProjectFlow Next.js application.

## 📁 Directory Structure

```
src/app/api/
├── auth/
│   ├── login/route.ts          # POST - User login
│   ├── logout/route.ts         # POST - User logout
│   ├── register/route.ts       # POST - User registration (TODO)
│   ├── verify-email/route.ts   # POST - Email verification (TODO)
│   └── reset-password/route.ts # POST - Password reset (TODO)
├── users/
│   ├── me/route.ts            # GET - Current user info
│   ├── [userId]/route.ts      # GET/PATCH/DELETE - User CRUD (TODO)
│   └── route.ts               # GET/POST - List/Create users (TODO)
├── projects/
│   ├── [projectId]/
│   │   ├── board/route.ts     # GET - Board view data (TODO)
│   │   ├── tasks/route.ts     # GET/POST - Project tasks (TODO)
│   │   └── route.ts           # GET/PATCH/DELETE - Project CRUD (TODO)
│   └── route.ts               # GET/POST - List/Create projects (TODO)
├── tasks/
│   ├── [taskId]/
│   │   ├── comments/route.ts  # GET/POST - Task comments (TODO)
│   │   ├── checklists/route.ts # GET/POST - Task checklists (TODO)
│   │   ├── close/route.ts     # POST - Close task (TODO)
│   │   └── route.ts           # GET/PATCH/DELETE - Task CRUD (TODO)
│   └── route.ts               # GET/POST - List/Create tasks (✅ Done)
├── notifications/route.ts      # GET/PATCH - Notifications (TODO)
└── health/route.ts            # GET - Health check (✅ Done)
```

## 🛠️ Core Libraries

### Database (`src/lib/db.ts`)
Prisma client singleton for database access.

```typescript
import { prisma } from '@/lib/db';

const users = await prisma.user.findMany();
```

### Authentication (`src/lib/auth.ts`)
Session management and password hashing.

```typescript
import { getSession, createSession, verifyPassword } from '@/lib/auth';

// Get session from request
const session = await getSession(req);

// Create new session
const { sessionToken, expiresAt } = await createSession(userId);

// Verify password
const isValid = verifyPassword(password, salt, hash);
```

### Permissions (`src/lib/permissions.ts`)
Role-based access control with 6-level hierarchy:
- **ADMIN**: All permissions
- **CHIEF**: Mission Group level access
- **LEADER**: Division level access
- **HEAD**: Department level access
- **MEMBER**: Limited access (own tasks)
- **USER**: Read-only access

```typescript
import { checkPermission, canUserEditTask } from '@/lib/permissions';

// Check permission
const hasAccess = await checkPermission(userId, 'edit_tasks', { taskId });

// Convenience functions
const canEdit = await canUserEditTask(userId, taskId);
```

### API Response (`src/lib/api-response.ts`)
Standardized response format and error handling.

```typescript
import { successResponse, errorResponse, ErrorResponses } from '@/lib/api-response';

// Success
return successResponse({ data: users }, 200);

// Error
return errorResponse('NOT_FOUND', 'User not found', 404);

// Common errors
return ErrorResponses.unauthorized();
return ErrorResponses.forbidden();
return ErrorResponses.notFound('User');
```

### API Middleware (`src/lib/api-middleware.ts`)
Authentication and permission wrappers.

```typescript
import { withAuth, withPermission, withRole } from '@/lib/api-middleware';

// Require authentication
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const userId = req.session.userId;
  // handler logic
});

// Require permission
export const DELETE = withPermission(
  'delete_tasks',
  async (req: AuthenticatedRequest, { params }) => {
    // handler logic
  },
  (req, { params }) => ({ taskId: params.taskId })
);

// Require role
export const POST = withRole(['ADMIN', 'CHIEF'], async (req) => {
  // handler logic
});
```

## 🔐 Authentication Flow

### 1. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "sessionToken": "abc123...",
    "expiresAt": "2025-10-27T00:00:00.000Z",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "HEAD",
      "permissions": ["view_tasks", "edit_tasks", ...],
      "department": { "id": "dept-id", "name": "IT Department" }
    }
  }
}
```

### 2. Authenticated Requests
Include session token in Authorization header:

```http
GET /api/users/me
Authorization: Bearer abc123...
```

### 3. Logout
```http
POST /api/auth/logout
Authorization: Bearer abc123...
```

## 📊 API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "details": { ... }
  }
}
```

## 🚀 Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Permission denied |
| `NOT_FOUND` | 404 | Resource not found |
| `BAD_REQUEST` | 400 | Invalid request data |
| `VALIDATION_ERROR` | 400 | Schema validation failed |
| `CONFLICT` | 409 | Duplicate resource |
| `INTERNAL_ERROR` | 500 | Server error |

## 🧪 Testing

Use the [test-api.http](../../../test-api.http) file with REST Client extension in VS Code.

1. Start development server:
   ```bash
   npm run dev
   ```

2. Open `test-api.http` in VS Code

3. Update `@sessionToken` after login

4. Click "Send Request" above each test

## 📝 Next Steps

### High Priority
- [ ] Complete remaining auth endpoints (register, verify, reset password)
- [ ] Implement Projects API (CRUD + board view)
- [ ] Implement Tasks API (CRUD + close)
- [ ] Implement Comments API
- [ ] Implement Checklists API

### Medium Priority
- [ ] Notifications API
- [ ] User management API
- [ ] Department/Division/Mission Group API
- [ ] Reports API

### Low Priority
- [ ] Rate limiting
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Webhooks
- [ ] Batch operations

## 🔗 Related Documentation

- [Database Migration Guide](../../../../migration_plan/01_DATABASE_MIGRATION.md)
- [API Migration Guide](../../../../migration_plan/02_API_MIGRATION.md)
- [Business Logic Guide](../../../../migration_plan/06_BUSINESS_LOGIC_GUIDE.md)
- [Prisma Schema](../../../../prisma/schema.prisma)
