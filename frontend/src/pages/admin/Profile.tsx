import React, { useCallback, useEffect, useState } from 'react';
import { getCurrentUser, updateUser, deleteUser } from '../../api/gateway';
import type { UserProfile, UpdateUserPayload } from '../../api/gateway';

const Profile = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<UpdateUserPayload>({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCurrentUser();
      setUser(data);
      setForm({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ?? '',
        companyName: data.companyName ?? '',
        taxId: data.taxId ?? '',
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await updateUser(user.id, form);
      setUser(updated);
      setSuccess('Profil mis a jour avec succes.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    if (!window.confirm('Etes-vous sur de vouloir supprimer votre compte ?')) return;
    try {
      await deleteUser(user.id);
      localStorage.removeItem('access_token');
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12 text-slate-500">Chargement...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-slate-900">Mon profil</h1>

      {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>}
      {success && <div className="rounded-xl bg-green-50 p-4 text-sm text-green-600">{success}</div>}

      <form onSubmit={handleSave} className="space-y-4 rounded-2xl bg-white p-6 shadow-card">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input name="email" type="email" value={form.email ?? ''} onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Telephone</span>
            <input name="phone" value={form.phone ?? ''} onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Prenom</span>
            <input name="firstName" value={form.firstName ?? ''} onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Nom</span>
            <input name="lastName" value={form.lastName ?? ''} onChange={handleChange}
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
        </div>

        {user && (
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">{user.role}</span>
            <span>{user.active ? 'Actif' : 'Inactif'}</span>
          </div>
        )}

        <div className="flex justify-between pt-2">
          <button type="submit" disabled={saving}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:shadow-lg disabled:opacity-50">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button type="button" onClick={handleDelete}
            className="rounded-xl border border-red-200 px-6 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50">
            Supprimer le compte
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
