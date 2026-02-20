import React, { useCallback, useEffect, useState } from 'react';
import { registerUser, getUsers, deleteUser } from '../../api/gateway';
import type { RegisterPayload, UserProfile } from '../../api/gateway';

const Users = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<RegisterPayload & { role: string }>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    companyName: '',
    taxId: '',
    role: 'USER',
  });

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data.content);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await registerUser(form);
      setSuccess(`Utilisateur ${form.email} cree avec succes.`);
      setForm({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        companyName: '',
        taxId: '',
        role: 'USER',
      });
      await loadUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user: UserProfile) => {
    if (!window.confirm(`Supprimer l'utilisateur ${user.email} ?`)) return;
    try {
      await deleteUser(user.id);
      setSuccess(`Utilisateur ${user.email} supprime.`);
      await loadUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-700',
      USER: 'bg-sky-100 text-sky-700',
      ACCOUNTANT: 'bg-amber-100 text-amber-700',
      MERCHANT: 'bg-emerald-100 text-emerald-700',
    };
    return (
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colors[role] ?? 'bg-slate-100 text-slate-600'}`}>
        {role}
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-slate-900">Gestion des utilisateurs</h1>

      {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>}
      {success && <div className="rounded-xl bg-green-50 p-4 text-sm text-green-600">{success}</div>}

      {/* Creation form */}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-card">
        <h2 className="text-lg font-semibold text-slate-800">Creer un utilisateur</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email *</span>
            <input name="email" type="email" required value={form.email} onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Mot de passe *</span>
            <input name="password" type="password" required value={form.password} onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Prenom *</span>
            <input name="firstName" required value={form.firstName} onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Nom *</span>
            <input name="lastName" required value={form.lastName} onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Telephone</span>
            <input name="phone" value={form.phone ?? ''} onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Entreprise</span>
            <input name="companyName" value={form.companyName ?? ''} onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">N. fiscal</span>
            <input name="taxId" value={form.taxId ?? ''} onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Role *</span>
            <select name="role" value={form.role} onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white">
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>
        </div>

        <button type="submit" disabled={submitting}
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:shadow-lg disabled:opacity-50">
          {submitting ? 'Creation...' : 'Creer l\'utilisateur'}
        </button>
      </form>

      {/* User list */}
      <div className="rounded-2xl bg-white p-6 shadow-card">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Utilisateurs existants</h2>

        {loading ? (
          <p className="text-sm text-slate-500">Chargement...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun utilisateur trouve.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                  <th className="pb-3 pr-4">Nom</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Entreprise</th>
                  <th className="pb-3 pr-4">Role</th>
                  <th className="pb-3 pr-4">Statut</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-slate-50">
                    <td className="py-3 pr-4 font-medium text-slate-900">{u.firstName} {u.lastName}</td>
                    <td className="py-3 pr-4 text-slate-600">{u.email}</td>
                    <td className="py-3 pr-4 text-slate-600">{u.companyName || '-'}</td>
                    <td className="py-3 pr-4">{roleBadge(u.role)}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${u.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {u.active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="py-3">
                      <button type="button" onClick={() => handleDelete(u)}
                        className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50">
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
