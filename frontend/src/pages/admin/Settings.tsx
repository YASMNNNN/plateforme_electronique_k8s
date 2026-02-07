import React, { useEffect, useState } from 'react';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  sendTestNotificationEmail,
  type NotificationPreferences,
} from '../../api/gateway';

const DEFAULT_EMAIL = 'yasminegr432@gmail.com';

const Settings = () => {
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    email: DEFAULT_EMAIL,
    emailEnabled: true,
    paymentAlertsEnabled: true,
    invoiceAlertsEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getNotificationPreferences()
      .then((data) => {
        if (!cancelled) {
          setPrefs({
            email: data.email || DEFAULT_EMAIL,
            emailEnabled: data.emailEnabled ?? true,
            paymentAlertsEnabled: data.paymentAlertsEnabled ?? true,
            invoiceAlertsEnabled: data.invoiceAlertsEnabled ?? true,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPrefs((p) => ({ ...p, email: DEFAULT_EMAIL }));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      await updateNotificationPreferences(prefs);
      setMessage({ type: 'success', text: 'Préférences enregistrées.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    const email = prefs.email?.trim() || DEFAULT_EMAIL;
    if (!email) return;
    setMessage(null);
    setTestSending(true);
    try {
      await sendTestNotificationEmail(email);
      setMessage({ type: 'success', text: `Email de test envoyé à ${email}.` });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Impossible d\'envoyer l\'email de test (vérifiez la config SMTP / mot de passe d\'application Gmail).',
      });
    } finally {
      setTestSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/80 bg-white p-6 shadow-card">
        <h2 className="font-display text-xl font-semibold text-ink-900">
          Parametres
        </h2>
        <p className="text-sm text-slate-500">
          Gere les preferences de la plateforme et les profils utilisateurs.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <form
          onSubmit={handleSave}
          className="rounded-3xl border border-white/80 bg-white p-6 shadow-card"
        >
          <p className="text-sm font-semibold text-slate-600">
            Notifications
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Parametrez les alertes de paiement et de facturation. Activez les notifications par e-mail (Gmail).
          </p>

          {loading ? (
            <p className="mt-4 text-sm text-slate-500">Chargement...</p>
          ) : (
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="notif-email" className="block text-sm font-medium text-slate-700">
                  E-mail pour les notifications
                </label>
                <input
                  id="notif-email"
                  type="email"
                  value={prefs.email}
                  onChange={(e) => setPrefs((p) => ({ ...p, email: e.target.value }))}
                  placeholder={DEFAULT_EMAIL}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={prefs.emailEnabled}
                  onChange={(e) => setPrefs((p) => ({ ...p, emailEnabled: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <span className="text-sm font-medium text-slate-700">
                  Activer les notifications par e-mail
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={prefs.paymentAlertsEnabled}
                  onChange={(e) => setPrefs((p) => ({ ...p, paymentAlertsEnabled: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">
                  Alertes de paiement
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={prefs.invoiceAlertsEnabled}
                  onChange={(e) => setPrefs((p) => ({ ...p, invoiceAlertsEnabled: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">
                  Alertes de facturation
                </span>
              </label>

              {message && (
                <p
                  className={`text-sm ${
                    message.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {message.text}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl border border-ink-200 bg-ink-50 px-4 py-2 text-sm font-semibold text-ink-700 disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={testSending || !prefs.email?.trim()}
                  className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 disabled:opacity-50"
                >
                  {testSending ? 'Envoi...' : 'Envoyer un e-mail de test'}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="rounded-3xl border border-white/80 bg-white p-6 shadow-card">
          <p className="text-sm font-semibold text-slate-600">
            API & securite
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Mettez a jour les clefs et les roles d'acces.
          </p>
          <button
            type="button"
            className="mt-4 rounded-2xl border border-ink-200 bg-ink-50 px-4 py-2 text-sm font-semibold text-ink-700"
          >
            Gerer les acces
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
