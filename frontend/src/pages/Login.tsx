import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, verifyMfaCode } from '../api/gateway';
import type { AuthResponse } from '../api/types';
import { useAuth } from '../contexts/AuthContext';

type Step = 'credentials' | 'mfa';

const Login = () => {
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const completeLogin = async (auth: AuthResponse) => {
    if (!auth.accessToken || !auth.refreshToken) {
      throw new Error('Invalid authentication response');
    }
    localStorage.setItem('access_token', auth.accessToken);
    localStorage.setItem('refresh_token', auth.refreshToken);
    localStorage.setItem('demo_auth', 'true');
    await refreshUser();
    navigate('/admin');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const auth = await loginUser({ email, password });
      if (auth.mfaRequired && auth.mfaToken) {
        setMfaToken(auth.mfaToken);
        setStep('mfa');
        setCode('');
        return;
      }
      await completeLogin(auth);
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const auth = await verifyMfaCode({ mfaToken, code: code.trim() });
      await completeLogin(auth);
    } catch (err: any) {
      setError(err.message || 'Code invalide.');
    } finally {
      setLoading(false);
    }
  };

  const resetToCredentials = () => {
    setStep('credentials');
    setMfaToken('');
    setCode('');
    setError('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#ffffff,_#e7ecf7,_#d9e1f1)] px-6 py-10">
      <div className="w-full max-w-md rounded-3xl border border-white/80 bg-white p-8 shadow-card">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-500">
            Plateforme
          </p>
          <h1 className="font-display text-2xl font-semibold text-ink-900">
            {step === 'credentials' ? 'Connexion' : 'Vérification en deux étapes'}
          </h1>
          <p className="text-sm text-slate-500">
            {step === 'credentials'
              ? 'Connectez-vous avec votre compte.'
              : 'Entrez le code à 6 chiffres de votre application d\'authentification ou un code de récupération.'}
          </p>
        </div>

        {step === 'credentials' ? (
          <>
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

            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Connexion rapide
              </p>
              <div className="space-y-2">
                {[
                  { label: 'Admin — Yassmine Grassa', email: 'yasminegr432@gmail.com', password: 'yassmine123', role: 'ADMIN' },
                  { label: 'Admin — Amel Dabbabi', email: 'admin@example.com', password: 'admin1234', role: 'ADMIN' },
                  { label: 'User — Jean Dupont', email: 'user@example.com', password: 'user1234', role: 'USER' },
                ].map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => { setEmail(account.email); setPassword(account.password); setError(''); }}
                    className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-left transition hover:border-ink-300 hover:bg-ink-50"
                  >
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      account.role === 'ADMIN'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-sky-100 text-sky-700'
                    }`}>
                      {account.role}
                    </span>
                    <span className="flex-1 text-sm font-medium text-slate-700">{account.label}</span>
                    <span className="text-[11px] text-slate-400">{account.email}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Cliquez sur un compte puis sur « Se connecter ».
              </p>
            </div>
          </>

        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <label className="text-sm font-semibold text-slate-600">
              Code de vérification
              <input
                type="text"
                inputMode="text"
                autoComplete="one-time-code"
                autoFocus
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="123456"
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-center text-lg tracking-[0.3em]"
              />
            </label>
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600">
                {error}
              </div>
            ) : null}
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full rounded-2xl bg-ink-500 px-4 py-3 text-sm font-semibold text-white shadow-soft disabled:opacity-50"
            >
              {loading ? 'Vérification...' : 'Vérifier'}
            </button>
            <button
              type="button"
              onClick={resetToCredentials}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Retour à la connexion
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
