export const ROLES = Object.freeze({ ADMIN: 'admin', MEMBER: 'member' });
export const hasRole = (user, ...roles) => Boolean(user?.active && roles.includes(user.role));
export const canManageUsers = user => hasRole(user, ROLES.ADMIN);
