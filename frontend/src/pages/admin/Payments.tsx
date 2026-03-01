import React, { useEffect, useState } from 'react';
import { getPayments, Payment } from '../../api/gateway';
import { usePermission } from '../../hooks/usePermission';

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { can } = usePermission();

  const showGlobalStats = can('payments.globalStats');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const response = await getPayments();
        if (isMounted) {
          setPayments(response);
          setError('');
        }
      } catch {
        if (isMounted) {
          setPayments([]);
          setError(
            "Impossible de charger les paiements via l'API Gateway."
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalCompleted = payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalPending = payments
    .filter((p) => p.status === 'PENDING')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalAll = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'TND',
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
      ) : null}
      <div className="rounded-3xl border border-white/80 bg-white p-6 shadow-card">
        <h2 className="font-display text-xl font-semibold text-ink-900">
          Paiements
        </h2>
        <p className="text-sm text-slate-500">
          Historique des paiements et statuts de transaction.
        </p>
      </div>

      {!loading && payments.length > 0 && showGlobalStats ? (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/80 bg-white p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">
              Total general
            </p>
            <p className="mt-3 font-display text-2xl font-semibold text-ink-900">
              {formatCurrency(totalAll)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-600">
              Total confirme
            </p>
            <p className="mt-3 font-display text-2xl font-semibold text-green-700">
              {formatCurrency(totalCompleted)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
              Total en attente
            </p>
            <p className="mt-3 font-display text-2xl font-semibold text-amber-700">
              {formatCurrency(totalPending)}
            </p>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-white/80 bg-white shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-400">
            <tr>
              <th className="px-6 py-4">Reference</th>
              <th className="px-6 py-4">Montant</th>
              <th className="px-6 py-4">Methode</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-t border-slate-100">
                <td className="px-6 py-4 font-semibold text-slate-800">
                  {payment.reference}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {payment.amount.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: payment.currency || 'TND',
                  })}
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {payment.method}
                </td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-600">
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {payment.paymentDate
                    ? new Date(payment.paymentDate).toLocaleDateString('fr-FR')
                    : '-'}
                </td>
              </tr>
            ))}
            {!loading && payments.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-6 text-center text-sm text-slate-400"
                >
                  Aucun paiement enregistre.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payments;
