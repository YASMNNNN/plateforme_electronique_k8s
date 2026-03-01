import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateUser, deleteUser, changePassword } from '../../api/gateway';
import type { UpdateUserPayload } from '../../api/gateway';
import { useAuth } from '../../contexts/AuthContext';

const Profile = () => {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<UpdateUserPayload>({});

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone ?? '',
        companyName: user.companyName ?? '',
        taxId: user.taxId ?? '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Impossible de sauvegarder : profil non charge. Veuillez rafraichir la page.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await updateUser(user.id, form);
      await refreshUser();
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
      logout();
      navigate('/login');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (newPassword !== confirmPassword) {
      setPwError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('Le nouveau mot de passe doit contenir au moins 8 caracteres.');
      return;
    }
    setPwSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setPwSuccess('Mot de passe modifie avec succes.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwError(err.message);
    } finally {
      setPwSaving(false);
    }
  };

  if (!user) {
    return <div className="flex items-center justify-center p-12 text-slate-500">Chargement...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-slate-900">Mon profil</h1>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}
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

        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">{user.role}</span>
          <span>{user.active ? 'Actif' : 'Inactif'}</span>
        </div>

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

      {/* Password change form */}
      <form onSubmit={handleChangePassword} className="space-y-4 rounded-2xl bg-white p-6 shadow-card">
        <h2 className="font-display text-lg font-semibold text-slate-900">Changer le mot de passe</h2>

        {pwError && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{pwError}</div>
        )}
        {pwSuccess && (
          <div className="rounded-xl bg-green-50 p-4 text-sm text-green-600">{pwSuccess}</div>
        )}

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Mot de passe actuel</span>
          <input type="password" value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Nouveau mot de passe</span>
          <input type="password" value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required minLength={8}
            className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Confirmer le nouveau mot de passe</span>
          <input type="password" value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required minLength={8}
            className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </label>

        <button type="submit" disabled={pwSaving}
          className="rounded-xl bg-ink-500 px-6 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:shadow-lg disabled:opacity-50">
          {pwSaving ? 'Modification...' : 'Modifier le mot de passe'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
