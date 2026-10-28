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
  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.scrollingElement?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.querySelector('.workspace-content')?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.querySelector('.campus-main')?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  });
}
