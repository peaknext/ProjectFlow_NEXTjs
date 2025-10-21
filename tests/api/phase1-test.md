# Phase 1 API Testing Guide

## Prerequisites
- Development server running: `npm run dev`
- Database running with Prisma migrations applied
- Test user created (or use registration endpoint)

---

## 1. Authentication APIs

### 1.1 Register New User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "fullName": "Test User",
    "jobTitle": "Developer"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clxy...",
      "email": "test@example.com",
      "fullName": "Test User",
      "role": "USER",
      "isVerified": false
    },
    "message": "Registration successful. Please check your email to verify your account.",
    "verificationRequired": true
  }
}
```

### 1.2 Verify Email
```bash
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_VERIFICATION_TOKEN"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "message": "Email verified successfully",
    "user": {
      "id": "clxy...",
      "email": "test@example.com",
      "isVerified": true
    }
  }
}
```

### 1.3 Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "sessionToken": "abc123...",
    "expiresAt": "2025-10-28T...",
    "user": {
      "id": "clxy...",
      "email": "test@example.com",
      "fullName": "Test User",
      "role": "USER",
      "permissions": ["view_projects", "view_tasks"]
    }
  }
}
```

**Save the sessionToken for subsequent requests!**

### 1.4 Request Password Reset
```bash
curl -X POST http://localhost:3000/api/auth/request-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

### 1.5 Reset Password
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_RESET_TOKEN",
    "newPassword": "NewPassword456"
  }'
```

### 1.6 Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

---

## 2. User Management APIs

**Note: Replace `YOUR_SESSION_TOKEN` with the token from login response**

### 2.1 Get Current User
```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

### 2.2 List All Users
```bash
# Basic list
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# With filters and pagination
curl -X GET "http://localhost:3000/api/users?page=1&limit=10&search=test&role=USER" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "clxy...",
        "email": "test@example.com",
        "fullName": "Test User",
        "role": "USER",
        "userStatus": "ACTIVE",
        "department": null
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

### 2.3 Get User by ID
```bash
curl -X GET http://localhost:3000/api/users/USER_ID \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

### 2.4 Update User
```bash
curl -X PATCH http://localhost:3000/api/users/USER_ID \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Updated Name",
    "jobTitle": "Senior Developer"
  }'
```

### 2.5 Update User Status (Admin only)
```bash
curl -X PATCH http://localhost:3000/api/users/USER_ID/status \
  -H "Authorization: Bearer ADMIN_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "SUSPENDED",
    "reason": "Policy violation"
  }'
```

### 2.6 Delete User (Soft Delete)
```bash
curl -X DELETE http://localhost:3000/api/users/USER_ID \
  -H "Authorization: Bearer ADMIN_SESSION_TOKEN"
```

### 2.7 Get User Permissions
```bash
# Base permissions
curl -X GET http://localhost:3000/api/users/USER_ID/permissions \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# With context (department-specific)
curl -X GET "http://localhost:3000/api/users/USER_ID/permissions?departmentId=DEPT_ID" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

### 2.8 Search Users for Mentions
```bash
# Search by name
curl -X GET "http://localhost:3000/api/users/mentions?q=test&limit=5" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# Filter by department
curl -X GET "http://localhost:3000/api/users/mentions?q=john&departmentId=DEPT_ID" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "clxy...",
        "email": "test@example.com",
        "name": "Test User",
        "avatar": null,
        "role": "USER",
        "jobTitle": "Developer",
        "department": "IT Department",
        "display": "Test User (IT Department)",
        "mention": "@test"
      }
    ],
    "total": 1,
    "query": "test"
  }
}
```

---

## 3. Error Cases to Test

### 3.1 Authentication Errors
```bash
# Login with invalid credentials
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "WrongPassword"
  }'
# Expected: 401 INVALID_CREDENTIALS

# Access protected endpoint without token
curl -X GET http://localhost:3000/api/users
# Expected: 401 UNAUTHORIZED
```

### 3.2 Permission Errors
```bash
# Try to update user status without admin permission
curl -X PATCH http://localhost:3000/api/users/USER_ID/status \
  -H "Authorization: Bearer USER_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "SUSPENDED"}'
# Expected: 403 FORBIDDEN
```

### 3.3 Validation Errors
```bash
# Register with invalid email
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "not-an-email",
    "password": "test",
    "fullName": ""
  }'
# Expected: 400 VALIDATION_ERROR
```

---

## 4. Automated Testing Script

Create a file `tests/run-phase1-tests.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:3000"
TOKEN=""

echo "=== Phase 1 API Tests ==="
echo ""

# 1. Register
echo "1. Testing Registration..."
REGISTER_RESPONSE=$(curl -s -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "autotest@example.com",
    "password": "TestPassword123",
    "fullName": "Auto Test User"
  }')
echo $REGISTER_RESPONSE | jq
echo ""

# 2. Login
echo "2. Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "autotest@example.com",
    "password": "TestPassword123"
  }')
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.sessionToken')
echo "Token: $TOKEN"
echo ""

# 3. Get Current User
echo "3. Testing Get Current User..."
curl -s -X GET $API_URL/api/users/me \
  -H "Authorization: Bearer $TOKEN" | jq
echo ""

# 4. List Users
echo "4. Testing List Users..."
curl -s -X GET "$API_URL/api/users?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq
echo ""

# 5. Search Mentions
echo "5. Testing User Mentions..."
curl -s -X GET "$API_URL/api/users/mentions?q=auto" \
  -H "Authorization: Bearer $TOKEN" | jq
echo ""

# 6. Logout
echo "6. Testing Logout..."
curl -s -X POST $API_URL/api/auth/logout \
  -H "Authorization: Bearer $TOKEN" | jq
echo ""

echo "=== Tests Complete ==="
```

Make it executable:
```bash
chmod +x tests/run-phase1-tests.sh
```

Run tests:
```bash
./tests/run-phase1-tests.sh
```

---

## 5. Success Criteria

✅ **Phase 1 is complete when:**

- [ ] All 13 endpoints return correct HTTP status codes
- [ ] Authentication flow works (register → verify → login → logout)
- [ ] Password reset flow works (request → reset)
- [ ] User CRUD operations work with proper permissions
- [ ] User search/mentions return correct filtered results
- [ ] Permission checks enforce access control
- [ ] Validation errors return meaningful messages
- [ ] All responses follow consistent format
- [ ] Session management works (create/validate/delete)
- [ ] Soft delete doesn't expose deleted users

---

## Next Steps

After Phase 1 testing is complete:
1. Document any bugs found
2. Fix critical issues
3. Create Postman collection for Phase 1
4. Proceed to **Phase 2: Organization APIs**
