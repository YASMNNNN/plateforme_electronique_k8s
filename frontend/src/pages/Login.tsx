import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api/gateway';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const auth = await loginUser({ email, password });
      localStorage.setItem('access_token', auth.accessToken);
      localStorage.setItem('refresh_token', auth.refreshToken);
      localStorage.setItem('demo_auth', 'true');
      await refreshUser();
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#ffffff,_#e7ecf7,_#d9e1f1)] px-6 py-10">
      <div className="w-full max-w-md rounded-3xl border border-white/80 bg-white p-8 shadow-card">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-500">
            Plateforme
          </p>
          <h1 className="font-display text-2xl font-semibold text-ink-900">
            Connexion
          </h1>
          <p className="text-sm text-slate-500">
            Connectez-vous avec votre compte.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="text-sm font-semibold text-slate-600">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="votre.email@exemple.com"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-semibold text-slate-600">
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mot de passe"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
            />
          </label>
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600">
              {error}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-ink-500 px-4 py-3 text-sm font-semibold text-white shadow-soft disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
