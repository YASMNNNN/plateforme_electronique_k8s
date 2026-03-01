import React from 'react';
import { NavLink } from 'react-router-dom';
import logo from '../assets/logo.jpg';
import { getSidebarItems } from '../config/permissions';
import { useAuth } from '../contexts/AuthContext';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition',
    isActive
      ? 'bg-gradient-to-r from-emerald-500 to-sky-500 text-white shadow-soft'
      : 'text-slate-600 hover:bg-white/80 hover:text-slate-900',
  ].join(' ');

const Sidebar = () => {
  const { user } = useAuth();
  const role = user?.role ?? 'USER';
  const items = getSidebarItems(role);

  return (
    <aside className="w-full max-w-[270px] border-r border-white/50 bg-white/70 p-6 backdrop-blur-xl lg:min-h-screen">
      <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-card">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-sky-500 text-white">
          PE
        </div>
        <div>
          <p className="font-display text-sm font-semibold text-slate-900">
            Plateforme
          </p>
          <p className="text-xs text-slate-500">Paiements electroniques</p>
        </div>
      </div>

      <nav className="mt-10 grid gap-2">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            className={navLinkClass}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-10 flex justify-center rounded-2xl border border-white/70 bg-white/70 p-4">
        <img
          src={logo}
          alt="Logo Plateforme Electronique"
          className="max-h-24 w-auto object-contain"
        />
      </div>
    </aside>
  );
};

export default Sidebar;
