import React, { useEffect, useMemo, useState } from 'react';
import {
  getInvoices,
  getPayments,
  Invoice,
  InvoicePage,
  Payment,
} from '../../api/gateway';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'TND',
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (value?: string) =>
  value
    ? new Intl.DateTimeFormat('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(value))
    : '-';

const Dashboard = () => {
  const [invoicePage, setInvoicePage] = useState<InvoicePage | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { can, isAdmin, userId } = usePermission();

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const invoiceParams: { ownerUserId?: string; page?: number; size?: number } = {
          page: 0,
          size: 50,
        };
        if (!isAdmin && userId) {
          invoiceParams.ownerUserId = userId;
        }
        const [invoicesResponse, paymentsResponse] = await Promise.all([
          getInvoices(invoiceParams),
          getPayments(),
        ]);
        if (!isMounted) return;
        setInvoicePage(invoicesResponse);
        setPayments(paymentsResponse);
        setError('');
      } catch (err) {
        if (!isMounted) return;
        setError(
          'Impossible de charger les donnees depuis la passerelle API. Mode hors ligne.'
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [isAdmin, userId]);

  const invoices = invoicePage?.content ?? [];

  const stats = useMemo(() => {
    const totalInvoices = invoicePage?.totalElements ?? invoices.length;
    const totalPayments = payments.length;
    const revenue = invoices
      .filter((invoice) => invoice.status === 'PAID')
      .reduce((sum, invoice) => sum + (invoice.totalTtc || 0), 0);
    const uniqueClients = new Set(
      invoices.map((invoice) => invoice.clientEmail || invoice.clientName || '')
    ).size;

    return [
      { label: 'Factures', value: totalInvoices.toString() },
      { label: 'Paiements', value: totalPayments.toString() },
      { label: 'Clients', value: uniqueClients.toString() },
      { label: 'Revenus', value: formatCurrency(revenue) },
    ];
  }, [invoicePage, invoices, payments]);

  const recentInvoices = invoices.slice(0, 5);
  const recentPayments = [...payments]
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 5);

  const revenueSeries = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      return {
        key,
        label: date.toLocaleDateString('fr-FR', { month: 'short' }),
        total: 0,
      };
    });

    invoices.forEach((invoice) => {
      if (invoice.status !== 'PAID' || !invoice.issueDate) return;
      const date = new Date(invoice.issueDate);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const target = months.find((month) => month.key === key);
      if (target) {
        target.total += invoice.totalTtc || 0;
      }
    });

    return months;
  }, [invoices]);

  const maxRevenue = Math.max(
    ...revenueSeries.map((point) => point.total),
    1
  );

  const chartPoints = revenueSeries
    .map((point, index) => {
      const x = (index / (revenueSeries.length - 1)) * 100;
      const y = 100 - (point.total / maxRevenue) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/80 bg-white p-5 shadow-card"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">
              {stat.label}
            </p>
            <p className="mt-3 font-display text-2xl font-semibold text-ink-900">
              {loading ? '...' : stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-3xl border border-white/80 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">
                Revenus des 6 derniers mois
              </p>
              <p className="font-display text-2xl font-semibold text-ink-900">
                {formatCurrency(
                  revenueSeries.reduce((sum, point) => sum + point.total, 0)
                )}
              </p>
            </div>
            <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-600">
              TND
            </span>
          </div>
          <div className="mt-6">
            <svg viewBox="0 0 100 100" className="h-40 w-full">
              <defs>
                <linearGradient
                  id="revenueGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#5e6fc1" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#5e6fc1" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <polyline
                fill="none"
                stroke="#5e6fc1"
                strokeWidth="2.5"
                points={chartPoints}
              />
              <polygon
                points={`${chartPoints} 100,100 0,100`}
                fill="url(#revenueGradient)"
              />
            </svg>
            <div className="mt-3 flex justify-between text-xs text-slate-500">
              {revenueSeries.map((point) => (
                <span key={point.key}>{point.label}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/80 bg-gradient-to-br from-white via-white to-ink-50 p-6 shadow-card">
              <p className="text-sm font-semibold text-slate-500">
                Activite rapide
              </p>
          <div className="mt-6 space-y-4">
            {[
              {
                label: 'Factures en attente',
                value: invoices.filter((invoice) => invoice.status === 'SENT')
                  .length,
              },
              {
                label: 'Factures payees',
                value: invoices.filter((invoice) => invoice.status === 'PAID')
                  .length,
              },
              {
                label: 'Paiements en cours',
                value: payments.filter((payment) => payment.status === 'PENDING')
                  .length,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-2xl border border-white/80 bg-white/70 px-4 py-3"
              >
                <span className="text-sm text-slate-600">{item.label}</span>
                <span className="font-semibold text-ink-700">
                  {loading ? '...' : item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/80 bg-white p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              Dernieres factures
            </h2>
            <span className="text-xs text-slate-400">Top 5</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="pb-3">Client</th>
                  <th className="pb-3">Montant</th>
                  <th className="pb-3">Statut</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                {recentInvoices.map((invoice: Invoice) => (
                  <tr key={invoice.id} className="border-t border-slate-100">
                    <td className="py-3">
                      <div className="font-semibold text-slate-800">
                        {invoice.clientName || 'Client'}
                      </div>
                      <div className="text-xs text-slate-400">
                        {invoice.invoiceNumber || 'DRAFT'}
                      </div>
                    </td>
                    <td className="py-3">
                      {formatCurrency(invoice.totalTtc || 0)}
                    </td>
                    <td className="py-3">
                      <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-600">
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && recentInvoices.length === 0 ? (
                  <tr>
                    <td className="py-4 text-sm text-slate-400" colSpan={3}>
                      Aucune facture disponible.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-white/80 bg-white p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              Derniers paiements
            </h2>
            <span className="text-xs text-slate-400">Top 5</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="pb-3">Reference</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Montant</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                {recentPayments.map((payment: Payment) => (
                  <tr key={payment.id} className="border-t border-slate-100">
                    <td className="py-3 font-semibold text-slate-800">
                      {payment.reference}
                    </td>
                    <td className="py-3">{formatDate(payment.paymentDate)}</td>
                    <td className="py-3">
                      {formatCurrency(payment.amount || 0)}
                    </td>
                  </tr>
                ))}
                {!loading && recentPayments.length === 0 ? (
                  <tr>
                    <td className="py-4 text-sm text-slate-400" colSpan={3}>
                      Aucun paiement disponible.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
