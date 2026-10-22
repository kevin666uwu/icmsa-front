import { canManageUsers } from '../../lib/roles.js';
export function canAccessRoute(path, user) {
  if (path === '/admin' || path.startsWith('/admin/')) return canManageUsers(user);
  if (path === '/verify-email' || path === '/portal' || path.startsWith('/portal/')) return Boolean(user?.active);
  return true;
}
export function navigate(path) {
  if (!path.startsWith('/') || path.startsWith('//')) return;
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
