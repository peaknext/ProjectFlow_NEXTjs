-- Create ADMIN test user
-- Password: SecurePass123!
-- Salt: randomsalt123
-- Hash: 511d3401e1485e7cc4445127a363bf2d9564ad56c31237b5b7287a4785c03e93

INSERT INTO "User" (
  id,
  email,
  "fullName",
  "passwordHash",
  salt,
  role,
  "departmentId",
  "isVerified",
  "userStatus",
  "createdAt",
  "updatedAt"
) VALUES (
  'admin001',
  'admin@hospital.test',
  'Admin User (Test)',
  '511d3401e1485e7cc4445127a363bf2d9564ad56c31237b5b7287a4785c03e93',
  'randomsalt123',
  'ADMIN',
  'DEPT-059',
  true,
  'ACTIVE',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'ADMIN',
  "isVerified" = true,
  "userStatus" = 'ACTIVE';
