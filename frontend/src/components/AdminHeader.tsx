import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../api/gateway';
import type { UserProfile } from '../api/gateway';

const titleMap: Record<string, string> = {
  '/admin': 'Tableau de bord',
  '/admin/invoices': 'Factures client',
  '/admin/invoices/new': 'Nouvelle facture',
  '/admin/clients': 'Clients',
  '/admin/payments': 'Paiements',
  '/admin/users': 'Gestion des utilisateurs',
  '/admin/settings': 'Parametres',
};

const AdminHeader = () => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => {});
  }, []);

  const title = useMemo(
    () => titleMap[location.pathname] || 'Tableau de bord',
    [location.pathname]
  );

  const fullName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : '';
  const initials = user
    ? `${(user.firstName ?? '')[0] ?? ''}${(user.lastName ?? '')[0] ?? ''}`.toUpperCase()
    : '';

  const handleLogout = () => {
    localStorage.removeItem('demo_auth');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  return (
    <header className="flex flex-col gap-4 border-b border-white/60 bg-white/70 px-6 py-5 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
          Espace administrateur
        </p>
        <h1 className="font-display text-2xl font-semibold text-slate-900">
          {title}
        </h1>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white px-4 py-3 text-left shadow-card"
        >
          <div className="grid h-10 w-10 place-items-center rounded-full bg-ink-500 text-sm font-semibold text-white">
            {initials || '??'}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {fullName || 'Chargement...'}
            </p>
            <p className="text-xs text-slate-500">Administrateur</p>
          </div>
          <span className="text-xs text-slate-400">▾</span>
        </button>

        {open ? (
          <div className="absolute right-0 mt-3 w-48 rounded-2xl border border-white/70 bg-white p-2 text-sm shadow-card">
            <button
              type="button"
              onClick={() => navigate('/admin/settings')}
              className="w-full rounded-xl px-3 py-2 text-left font-medium text-slate-600 hover:bg-slate-100"
            >
              Parametres
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-xl px-3 py-2 text-left font-medium text-rose-600 hover:bg-rose-50"
            >
              Deconnexion
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
};

export default AdminHeader;
