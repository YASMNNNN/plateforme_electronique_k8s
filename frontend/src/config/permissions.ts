type RoutePermission = {
  path: string;
  roles: string[];
  sidebarLabel?: string;
  sidebarPath?: string;
};

export const ROUTE_PERMISSIONS: RoutePermission[] = [
  { path: '/admin', roles: ['ADMIN', 'USER'], sidebarLabel: 'Tableau de bord', sidebarPath: '/admin' },
  { path: '/admin/invoices', roles: ['ADMIN', 'USER'], sidebarLabel: 'Factures client', sidebarPath: '/admin/invoices' },
  { path: '/admin/invoices/new', roles: ['ADMIN', 'USER'] },
  { path: '/admin/invoices/:id', roles: ['ADMIN', 'USER'] },
  { path: '/admin/invoices/:id/edit', roles: ['ADMIN', 'USER'] },
  { path: '/admin/clients', roles: ['ADMIN', 'USER'] },
  { path: '/admin/payments', roles: ['ADMIN', 'USER'], sidebarLabel: 'Paiements', sidebarPath: '/admin/payments' },
  { path: '/admin/profile', roles: ['ADMIN', 'USER'], sidebarLabel: 'Mon profil', sidebarPath: '/admin/profile' },
  { path: '/admin/users', roles: ['ADMIN'], sidebarLabel: 'Utilisateurs', sidebarPath: '/admin/users' },
  { path: '/admin/subscriptions', roles: ['ADMIN'], sidebarLabel: 'Abonnements', sidebarPath: '/admin/subscriptions' },
  { path: '/admin/cards', roles: ['ADMIN'], sidebarLabel: 'Cartes', sidebarPath: '/admin/cards' },
  { path: '/admin/settings', roles: ['ADMIN'], sidebarLabel: 'Parametres', sidebarPath: '/admin/settings' },
];

export const FEATURE_PERMISSIONS: Record<string, string[]> = {
  'invoices.validate': ['ADMIN'],
  'invoices.delete': ['ADMIN'],
  'invoices.markPaid': ['ADMIN'],
  'payments.globalStats': ['ADMIN'],
  'dashboard.globalStats': ['ADMIN'],
};

export const canAccessRoute = (path: string, role: string): boolean => {
  const route = ROUTE_PERMISSIONS.find((r) => r.path === path);
  if (!route) return true;
  return route.roles.includes(role);
};

export const hasFeature = (feature: string, role: string): boolean => {
  const allowed = FEATURE_PERMISSIONS[feature];
  if (!allowed) return true;
  return allowed.includes(role);
};

export const getSidebarItems = (role: string) => {
  return ROUTE_PERMISSIONS.filter(
    (r) => r.sidebarLabel && r.sidebarPath && r.roles.includes(role)
  ).map((r) => ({
    label: r.sidebarLabel!,
    path: r.sidebarPath!,
  }));
};
