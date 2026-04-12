import React, { useState } from 'react';
import {
  disableTotp,
  enableTotp,
  regenerateRecoveryCodes,
  setupTotp,
} from '../api/gateway';
import type { TotpSetupResponse } from '../api/types';
import { useAuth } from '../contexts/AuthContext';

type Notice = { type: 'success' | 'error'; text: string } | null;

const TwoFactorCard = () => {
  const { user, refreshUser } = useAuth();
  const [setup, setSetup] = useState<TotpSetupResponse | null>(null);
  const [code, setCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const enabled = user?.totpEnabled ?? false;

  const handleSetup = async () => {
    setNotice(null);
    setBusy(true);
    try {
      const res = await setupTotp();
      setSetup(res);
      setCode('');
      setRecoveryCodes(null);
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Erreur' });
    } finally {
      setBusy(false);
    }
  };

  const handleEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setBusy(true);
    try {
      const res = await enableTotp(code.trim());
      setRecoveryCodes(res.recoveryCodes);
      setSetup(null);
      setCode('');
      await refreshUser();
      setNotice({
        type: 'success',
        text: '2FA activée. Conservez vos codes de récupération dans un endroit sûr.',
      });
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Code invalide' });
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setBusy(true);
    try {
      await disableTotp(password, disableCode.trim());
      setDisableCode('');
      setPassword('');
      setRecoveryCodes(null);
      await refreshUser();
      setNotice({ type: 'success', text: '2FA désactivée.' });
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Erreur' });
    } finally {
      setBusy(false);
    }
  };

  const handleRegenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setBusy(true);
    try {
      const res = await regenerateRecoveryCodes(code.trim());
      setRecoveryCodes(res.recoveryCodes);
      setCode('');
      setNotice({
        type: 'success',
        text: 'Nouveaux codes générés. Les anciens ne sont plus valides.',
      });
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Erreur' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-3xl border border-white/80 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-600">
            Authentification à deux facteurs (2FA)
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Protège votre compte avec un code TOTP (Google Authenticator, Authy, 1Password...).
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {enabled ? 'Activée' : 'Inactive'}
        </span>
      </div>

      {notice && (
        <div
          className={`mt-4 rounded-2xl border px-4 py-2 text-xs font-semibold ${
            notice.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {notice.text}
        </div>
      )}

      {recoveryCodes && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold text-amber-800">
            Codes de récupération — notés UNE seule fois
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-xs text-amber-900">
            {recoveryCodes.map((c) => (
              <code key={c} className="rounded bg-white px-2 py-1">
                {c}
              </code>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-amber-700">
            Chaque code n'est utilisable qu'une fois. Gardez-les dans un gestionnaire de mots de passe.
          </p>
        </div>
      )}

      {!enabled && !setup && (
        <button
          type="button"
          onClick={handleSetup}
          disabled={busy}
          className="mt-4 rounded-2xl border border-ink-200 bg-ink-50 px-4 py-2 text-sm font-semibold text-ink-700 disabled:opacity-50"
        >
          {busy ? 'Chargement...' : 'Activer la 2FA'}
        </button>
      )}

      {!enabled && setup && (
        <form onSubmit={handleEnable} className="mt-4 space-y-3">
          <p className="text-xs text-slate-600">
            Scannez ce QR code avec votre application, puis entrez le code à 6 chiffres affiché.
          </p>
          <img
            src={setup.qrCodeDataUri}
            alt="QR code 2FA"
            className="mx-auto h-44 w-44 rounded-xl border border-slate-200 bg-white p-2"
          />
          <details className="text-[11px] text-slate-500">
            <summary className="cursor-pointer">Saisie manuelle du secret</summary>
            <code className="mt-1 block break-all rounded bg-slate-50 p-2 font-mono text-slate-700">
              {setup.secret}
            </code>
          </details>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Code à 6 chiffres"
            required
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-center text-lg tracking-[0.3em]"
          />
          <button
            type="submit"
            disabled={busy || !code.trim()}
            className="w-full rounded-2xl bg-ink-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? 'Activation...' : 'Activer'}
          </button>
        </form>
      )}

      {enabled && (
        <div className="mt-4 space-y-4">
          <form onSubmit={handleRegenerate} className="space-y-2">
            <p className="text-xs font-semibold text-slate-600">
              Régénérer les codes de récupération
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Code 2FA"
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={busy || !code.trim()}
                className="rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-xs font-semibold text-ink-700 disabled:opacity-50"
              >
                Régénérer
              </button>
            </div>
          </form>

          <form onSubmit={handleDisable} className="space-y-2 border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-rose-700">Désactiver la 2FA</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe actuel"
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            />
            <input
              type="text"
              inputMode="text"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
              placeholder="Code 2FA (ou code de récupération)"
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={busy || !password.trim() || !disableCode.trim()}
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 disabled:opacity-50"
            >
              Désactiver la 2FA
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default TwoFactorCard;
