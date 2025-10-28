-- ProjectFlow Database Seed Script
-- Creates test data for integration testing
-- Security: VULN-001 Fix - Using bcrypt password hashing

-- 1. Create Admin User
-- Password: SecurePass123! (bcrypt with 12 rounds)
INSERT INTO users (id, email, "fullName", "passwordHash", salt, role, "userStatus", "isVerified", "jobTitle", "jobLevel", "createdAt", "updatedAt")
VALUES (
  'admin001',
  'admin@hospital.test',
  'System Administrator',
  '$2b$12$XAl7naBgrIzgZOsFQp2RaOxaJvcWM07ey1yf.YhrhMa6mzoH21jOu', -- bcrypt hash
  '', -- No longer used with bcrypt
  'ADMIN',
  'ACTIVE',
  true,
  'IT Director',
  'Executive',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- 2. Create Additional Users
-- All passwords: SecurePass123! (bcrypt with 12 rounds)
INSERT INTO users (id, email, "fullName", "passwordHash", salt, role, "userStatus", "isVerified", "departmentId", "jobTitle", "jobLevel", "createdAt", "updatedAt")
VALUES
  ('user001', 'somchai@hospital.test', 'สมชาย ใจดี', '$2b$12$/N79e7nRYyveplYIODM2nuz8av0fKKzSKE2Pq7n3YjgB8UCQF3tx2', '', 'LEADER', 'ACTIVE', true, NULL, 'Developer', 'Staff', NOW(), NOW()),
  ('user002', 'somying@hospital.test', 'สมหญิง สุขสันต์', '$2b$12$.xZKVBjdPL.jtUfNgABZDOegeVprrl9er2yggc4ToHoARXQ9ZUJZC', '', 'MEMBER', 'ACTIVE', true, NULL, 'Developer', 'Staff', NOW(), NOW()),
  ('user003', 'wichai@hospital.test', 'วิชัย พัฒนา', '$2b$12$Vg94iUZcmrstn9UjPfD8LOB2Ck.QvgSzFtCkKKGEaUW219UV6hpLG', '', 'MEMBER', 'ACTIVE', true, NULL, 'Developer', 'Staff', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- 3. Create Mission Group
INSERT INTO mission_groups (id, name, "chiefUserId", "createdAt", "updatedAt")
VALUES ('mg001', 'Hospital Digital Transformation', 'admin001', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. Create Division
INSERT INTO divisions (id, name, "missionGroupId", "leaderUserId", "createdAt", "updatedAt")
VALUES ('div001', 'Information Technology Division', 'mg001', 'admin001', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 5. Create Department
INSERT INTO departments (id, name, "divisionId", "headUserId", "createdAt", "updatedAt")
VALUES ('dept001', 'Software Development Department', 'div001', 'admin001', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Update users with department
UPDATE users SET "departmentId" = 'dept001' WHERE id IN ('user001', 'user002', 'user003');

-- 6. Create Project
INSERT INTO projects (id, name, description, "departmentId", "ownerUserId", status, "createdAt", "updatedAt")
VALUES ('proj001', 'Hospital Management System', 'Comprehensive hospital management and workflow system', 'dept001', 'admin001', 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 7. Create Statuses
INSERT INTO statuses (id, "projectId", name, color, type, "order", "createdAt", "updatedAt")
VALUES
  ('status001', 'proj001', 'Backlog', '#94a3b8', 'NOT_STARTED', 1, NOW(), NOW()),
  ('status002', 'proj001', 'Todo', '#64748b', 'NOT_STARTED', 2, NOW(), NOW()),
  ('status003', 'proj001', 'In Progress', '#3b82f6', 'IN_PROGRESS', 3, NOW(), NOW()),
  ('status004', 'proj001', 'Review', '#8b5cf6', 'IN_PROGRESS', 4, NOW(), NOW()),
  ('status005', 'proj001', 'Done', '#22c55e', 'DONE', 5, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 8. Create Tasks
INSERT INTO tasks (id, name, description, "projectId", "statusId", priority, difficulty, "creatorUserId", "assigneeUserId", "isClosed", "createdAt", "updatedAt")
VALUES
  ('task001', 'Setup Development Environment', 'Configure development tools and environment', 'proj001', 'status005', 3, 2, 'admin001', 'user001', true, NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days'),
  ('task002', 'Design Database Schema', 'Create ERD and database design', 'proj001', 'status005', 1, 4, 'admin001', 'user001', true, NOW() - INTERVAL '9 days', NOW() - INTERVAL '7 days'),
  ('task003', 'Implement User Authentication', 'Build JWT-based authentication system', 'proj001', 'status003', 1, 3, 'admin001', 'user002', false, NOW() - INTERVAL '5 days', NOW()),
  ('task004', 'Create Dashboard UI', 'Design and implement main dashboard', 'proj001', 'status003', 2, 3, 'admin001', 'user003', false, NOW() - INTERVAL '4 days', NOW()),
  ('task005', 'Implement Task Management', 'Build task CRUD operations', 'proj001', 'status002', 2, 3, 'admin001', 'user001', false, NOW() - INTERVAL '3 days', NOW()),
  ('task006', 'Setup Testing Framework', 'Configure Jest and testing tools', 'proj001', 'status002', 3, 2, 'admin001', 'user002', false, NOW() - INTERVAL '2 days', NOW()),
  ('task007', 'Write API Documentation', 'Document all API endpoints', 'proj001', 'status001', 3, 2, 'admin001', NULL, false, NOW() - INTERVAL '1 day', NOW()),
  ('task008', 'Performance Optimization', 'Optimize database queries', 'proj001', 'status001', 2, 4, 'admin001', NULL, false, NOW(), NOW()),
  ('task009', 'Security Audit', 'Review security measures', 'proj001', 'status001', 1, 5, 'admin001', NULL, false, NOW(), NOW()),
  ('task010', 'User Acceptance Testing', 'Conduct UAT with users', 'proj001', 'status001', 2, 3, 'admin001', NULL, false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Update closed tasks
UPDATE tasks SET "isClosed" = true, "closeType" = 'COMPLETED', "closeDate" = NOW() - INTERVAL '7 days', "userClosedId" = 'admin001' WHERE id IN ('task001', 'task002');

-- 9. Create Checklists
INSERT INTO checklists (id, name, "isChecked", "creatorUserId", "taskId", "createdDate", "updatedAt")
VALUES
  ('check001', 'Install Node.js', true, 'admin001', 'task001', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days'),
  ('check002', 'Install PostgreSQL', true, 'admin001', 'task001', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days'),
  ('check003', 'Configure environment variables', true, 'admin001', 'task001', NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days'),
  ('check004', 'Create ERD diagram', true, 'admin001', 'task002', NOW() - INTERVAL '9 days', NOW() - INTERVAL '8 days'),
  ('check005', 'Define table relationships', true, 'admin001', 'task002', NOW() - INTERVAL '9 days', NOW() - INTERVAL '7 days'),
  ('check006', 'Setup JWT library', true, 'admin001', 'task003', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
  ('check007', 'Implement login endpoint', false, 'admin001', 'task003', NOW() - INTERVAL '4 days', NOW()),
  ('check008', 'Add password hashing', false, 'admin001', 'task003', NOW() - INTERVAL '4 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- 10. Create Comments
INSERT INTO comments (id, "taskId", "commentorUserId", "commentText", "createdAt", "updatedAt")
VALUES
  ('comm001', 'task003', 'admin001', 'เริ่มทำงานนี้แล้ว กำลังศึกษา JWT library', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('comm002', 'task003', 'user002', 'ได้ครับ จะดูตัวอย่างจาก documentation', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('comm003', 'task004', 'admin001', '@wichai ช่วยดู design ของ dashboard ด้วยนะ', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
  ('comm004', 'task004', 'user003', 'ได้ครับ จะส่ง mockup ให้ดู', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  ('comm005', 'task005', 'user001', 'งานนี้ต้องทำหลังจาก task003 เสร็จ', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- 11. Create History/Activity Log
INSERT INTO histories (id, "historyText", "historyDate", "taskId", "userId")
VALUES
  ('hist001', 'สร้างงาน: Setup Development Environment', NOW() - INTERVAL '10 days', 'task001', 'admin001'),
  ('hist002', 'เปลี่ยนสถานะเป็น "Done"', NOW() - INTERVAL '8 days', 'task001', 'admin001'),
  ('hist003', 'ปิดงานสำเร็จ', NOW() - INTERVAL '7 days', 'task001', 'admin001'),
  ('hist004', 'สร้างงาน: Design Database Schema', NOW() - INTERVAL '9 days', 'task002', 'admin001'),
  ('hist005', 'ปิดงานสำเร็จ', NOW() - INTERVAL '7 days', 'task002', 'admin001'),
  ('hist006', 'สร้างงาน: Implement User Authentication', NOW() - INTERVAL '5 days', 'task003', 'admin001'),
  ('hist007', 'เปลี่ยนสถานะเป็น "In Progress"', NOW() - INTERVAL '4 days', 'task003', 'user002'),
  ('hist008', 'สร้างงาน: Create Dashboard UI', NOW() - INTERVAL '4 days', 'task004', 'admin001'),
  ('hist009', 'เปลี่ยนผู้รับผิดชอบเป็น วิชัย พัฒนา', NOW() - INTERVAL '4 days', 'task004', 'admin001'),
  ('hist010', 'เปลี่ยนสถานะเป็น "In Progress"', NOW() - INTERVAL '3 days', 'task004', 'user003')
ON CONFLICT (id) DO NOTHING;

-- 12. Create Notifications
INSERT INTO notifications (id, "userId", "triggeredByUserId", type, message, "taskId", "isRead", "createdAt")
VALUES
  ('notif001', 'user001', 'admin001', 'TASK_ASSIGNED', 'คุณได้รับมอบหมายงาน: Setup Development Environment', 'task001', true, NOW() - INTERVAL '10 days'),
  ('notif002', 'user001', 'admin001', 'TASK_ASSIGNED', 'คุณได้รับมอบหมายงาน: Design Database Schema', 'task002', true, NOW() - INTERVAL '9 days'),
  ('notif003', 'user002', 'admin001', 'TASK_ASSIGNED', 'คุณได้รับมอบหมายงาน: Implement User Authentication', 'task003', false, NOW() - INTERVAL '5 days'),
  ('notif004', 'user003', 'admin001', 'TASK_ASSIGNED', 'คุณได้รับมอบหมายงาน: Create Dashboard UI', 'task004', false, NOW() - INTERVAL '4 days'),
  ('notif005', 'user003', 'admin001', 'COMMENT_MENTION', 'คุณถูกกล่าวถึงในความคิดเห็น: @wichai ช่วยดู design ของ dashboard ด้วยนะ', 'task004', false, NOW() - INTERVAL '4 days'),
  ('notif006', 'user001', 'admin001', 'TASK_ASSIGNED', 'คุณได้รับมอบหมายงาน: Implement Task Management', 'task005', false, NOW() - INTERVAL '3 days'),
  ('notif007', 'user002', 'admin001', 'TASK_ASSIGNED', 'คุณได้รับมอบหมายงาน: Setup Testing Framework', 'task006', false, NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- 13. Update Pinned Tasks (stored as JSON in users table)
UPDATE users SET "pinnedTasks" = '["task005"]' WHERE id = 'user001';
UPDATE users SET "pinnedTasks" = '["task003"]' WHERE id = 'user002';
UPDATE users SET "pinnedTasks" = '["task004"]' WHERE id = 'user003';

-- 14. Create Project Phases (optional)
INSERT INTO phases (id, name, "phaseOrder", "projectId", "startDate", "endDate", "createdAt", "updatedAt")
VALUES
  ('phase001', 'Planning', 1, 'proj001', NOW() - INTERVAL '30 days', NOW() - INTERVAL '20 days', NOW(), NOW()),
  ('phase002', 'Development', 2, 'proj001', NOW() - INTERVAL '20 days', NOW() + INTERVAL '10 days', NOW(), NOW()),
  ('phase003', 'Testing', 3, 'proj001', NOW() + INTERVAL '10 days', NOW() + INTERVAL '20 days', NOW(), NOW()),
  ('phase004', 'Deployment', 4, 'proj001', NOW() + INTERVAL '20 days', NOW() + INTERVAL '30 days', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Summary
SELECT
  'Database seeded successfully!' as message,
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM mission_groups) as mission_groups,
  (SELECT COUNT(*) FROM divisions) as divisions,
  (SELECT COUNT(*) FROM departments) as departments,
  (SELECT COUNT(*) FROM projects) as projects,
  (SELECT COUNT(*) FROM statuses) as statuses,
  (SELECT COUNT(*) FROM tasks) as tasks,
  (SELECT COUNT(*) FROM checklists) as checklists,
  (SELECT COUNT(*) FROM comments) as comments,
  (SELECT COUNT(*) FROM histories) as histories,
  (SELECT COUNT(*) FROM notifications) as notifications,
  (SELECT COUNT(*) FROM users WHERE "pinnedTasks" IS NOT NULL) as users_with_pinned_tasks,
  (SELECT COUNT(*) FROM phases) as phases;
