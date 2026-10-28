import { canManageUsers } from '../../lib/roles.js';
export function canAccessRoute(path, user) {
  if (path === '/admin' || path.startsWith('/admin/')) return canManageUsers(user);
  if (path === '/verify-email' || path === '/portal' || path.startsWith('/portal/')) return Boolean(user?.active);
  return true;
}
export function navigate(path) {
  if (!path.startsWith('/') || path.startsWith('//')) return;
  window.history.pushState({}, '', path);
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  window.dispatchEvent(new PopStateEvent('popstate'));
}
