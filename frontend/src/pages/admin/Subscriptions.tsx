import React, { useCallback, useEffect, useState } from 'react';
import {
  getPlans,
  createSubscription,
  getSubscriptionByUser,
  cancelSubscription,
} from '../../api/gateway';
import type { Plan, Subscription } from '../../api/gateway';

const DEMO_USER_ID = '11111111-1111-1111-1111-111111111111';

const Subscriptions = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [p, sub] = await Promise.allSettled([
        getPlans(),
        getSubscriptionByUser(DEMO_USER_ID),
      ]);
      if (p.status === 'fulfilled') setPlans(p.value);
      if (sub.status === 'fulfilled') setSubscription(sub.value);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubscribe = async (planName: string) => {
    setError('');
    setSuccess('');
    try {
      const sub = await createSubscription({ userId: DEMO_USER_ID, planName });
      setSubscription(sub);
      setSuccess(`Abonnement ${planName} active avec succes.`);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleCancel = async () => {
    if (!subscription) return;
    if (!window.confirm('Annuler votre abonnement ?')) return;
    setError('');
    setSuccess('');
    try {
      const sub = await cancelSubscription(subscription.id);
      setSubscription(sub);
      setSuccess('Abonnement annule.');
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12 text-slate-500">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-slate-900">Abonnements</h1>

      {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>}
      {success && <div className="rounded-xl bg-green-50 p-4 text-sm text-green-600">{success}</div>}

      {subscription && (
        <div className="rounded-2xl bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-slate-900">Abonnement actuel</h2>
          <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
            <div><span className="font-medium">Plan :</span> {subscription.planName}</div>
            <div><span className="font-medium">Statut :</span> {subscription.status}</div>
            <div><span className="font-medium">Renouvellement :</span> {subscription.autoRenew ? 'Oui' : 'Non'}</div>
            <div><span className="font-medium">Debut :</span> {subscription.startDate}</div>
            <div><span className="font-medium">Fin :</span> {subscription.endDate}</div>
            <div><span className="font-medium">Prix mensuel :</span> {subscription.priceMonthly} TND</div>
          </div>
          {subscription.status === 'ACTIVE' && (
            <button onClick={handleCancel}
              className="mt-4 rounded-xl border border-red-200 px-5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
              Annuler l'abonnement
            </button>
          )}
        </div>
      )}

      <h2 className="text-lg font-semibold text-slate-900">Plans disponibles</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map(plan => (
          <div key={plan.id} className="flex flex-col justify-between rounded-2xl bg-white p-5 shadow-card">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900">{plan.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
              <p className="mt-3 text-2xl font-bold text-emerald-600">
                {plan.priceMonthly ?? 0} <span className="text-sm font-normal text-slate-400">TND/mois</span>
              </p>
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                <li>Factures/mois : {plan.maxInvoicesPerMonth ?? 'illimite'}</li>
                <li>Utilisateurs : {plan.maxUsers ?? 'illimite'}</li>
                {plan.signatureIncluded && <li>Signature incluse</li>}
                {plan.apiAccess && <li>Acces API</li>}
              </ul>
            </div>
            <button onClick={() => handleSubscribe(plan.name)}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:shadow-lg">
              Choisir
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Subscriptions;
