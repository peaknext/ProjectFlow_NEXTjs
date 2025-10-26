/**
 * Role utility functions for checking user permissions
 * Handles both primary role and additional roles
 */

export type UserRole = 'ADMIN' | 'CHIEF' | 'LEADER' | 'HEAD' | 'MEMBER' | 'USER';

/**
 * Role hierarchy (higher number = more privileged)
 */
const ROLE_LEVELS: Record<string, number> = {
  USER: 1,
  MEMBER: 2,
  HEAD: 3,
  LEADER: 4,
  CHIEF: 5,
  ADMIN: 6,
};

/**
 * Get role level for comparison
 */
export function getRoleLevel(role: string): number {
  return ROLE_LEVELS[role.toUpperCase()] || 0;
}

/**
 * Get highest role from primary role + additional roles
 * @param primaryRole - User's primary role
 * @param additionalRoles - Additional roles object (e.g., {"HEAD": "DEPT-001", "MEMBER": "DEPT-002"})
 * @returns Highest role
 */
export function getEffectiveRole(
  primaryRole: string,
  additionalRoles?: Record<string, string> | null
): UserRole {
  let highestRole = primaryRole;
  let highestLevel = getRoleLevel(primaryRole);

  // Check additional roles (supports both formats)
  if (additionalRoles && typeof additionalRoles === 'object') {
    Object.entries(additionalRoles).forEach(([key, value]) => {
      // Detect format: if key is a role name, use it; if key is dept ID, use value as role
      const role = key.startsWith('DEPT-') || key.startsWith('DIV-') || key.startsWith('dept')
        ? value  // Correct format: key=deptId, value=role
        : key;   // Legacy format: key=role, value=deptId

      const level = getRoleLevel(role);
      if (level > highestLevel) {
        highestLevel = level;
        highestRole = role;
      }
    });
  }

  return highestRole.toUpperCase() as UserRole;
}

/**
 * Check if user has any of the specified roles (checks primary + additional)
 * @param primaryRole - User's primary role
 * @param additionalRoles - Additional roles object
 * @param allowedRoles - Array of allowed roles
 * @returns true if user has any of the allowed roles
 */
export function hasAnyRole(
  primaryRole: string,
  additionalRoles: Record<string, string> | null | undefined,
  allowedRoles: string[]
): boolean {
  const effectiveRole = getEffectiveRole(primaryRole, additionalRoles);
  return allowedRoles.map(r => r.toUpperCase()).includes(effectiveRole);
}

/**
 * Check if user has specific role or higher
 * @param primaryRole - User's primary role
 * @param additionalRoles - Additional roles object
 * @param minimumRole - Minimum required role
 * @returns true if user's effective role is equal or higher than minimum
 */
export function hasRoleOrHigher(
  primaryRole: string,
  additionalRoles: Record<string, string> | null | undefined,
  minimumRole: string
): boolean {
  const effectiveRole = getEffectiveRole(primaryRole, additionalRoles);
  return getRoleLevel(effectiveRole) >= getRoleLevel(minimumRole);
}
