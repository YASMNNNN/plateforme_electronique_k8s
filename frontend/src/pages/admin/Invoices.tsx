import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getInvoices, Invoice, InvoiceStatus } from '../../api/gateway';

const statusStyles: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  VALIDATED: 'bg-amber-100 text-amber-700',
  SENT: 'bg-blue-100 text-blue-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
};

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const response = await getInvoices({
          page,
          size: 10,
        });
        if (!isMounted) return;
        setInvoices(response.content);
        setTotalPages(response.totalPages || 1);
        setError('');
      } catch {
        if (!isMounted) return;
        setInvoices([]);
        setTotalPages(1);
        setError(
          "Impossible de charger les factures via l'API Gateway."
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [page]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesStatus =
        statusFilter === 'ALL' || invoice.status === statusFilter;
      const searchValue = search.trim().toLowerCase();
      const matchesSearch =
        !searchValue ||
        invoice.clientName?.toLowerCase().includes(searchValue) ||
        invoice.clientEmail?.toLowerCase().includes(searchValue) ||
        invoice.invoiceNumber?.toLowerCase().includes(searchValue);
      return matchesStatus && matchesSearch;
    });
  }, [invoices, search, statusFilter]);

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
      ) : null}
      <div className="flex flex-col gap-4 rounded-3xl border border-white/80 bg-white p-6 shadow-card md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate-500">
            Suivi des factures emises et en cours.
          </p>
          <h2 className="font-display text-xl font-semibold text-ink-900">
            Liste des factures
          </h2>
        </div>
        <Link
          to="/admin/invoices/new"
          className="rounded-2xl bg-ink-500 px-4 py-3 text-sm font-semibold text-white shadow-soft"
        >
          Creer une facture
        </Link>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-2xl border border-white/70 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-card"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="DRAFT">Brouillon</option>
            <option value="VALIDATED">Validee</option>
            <option value="SENT">Envoyee</option>
            <option value="PAID">Payee</option>
            <option value="CANCELLED">Annulee</option>
          </select>
          <span className="rounded-2xl bg-white/70 px-4 py-2 text-xs font-semibold text-slate-500">
            Page {page + 1} / {totalPages}
          </span>
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher une facture..."
          className="w-full rounded-2xl border border-white/70 bg-white px-4 py-2 text-sm text-slate-600 shadow-card md:max-w-sm"
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/80 bg-white shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-400">
            <tr>
              <th className="px-6 py-4">Numero</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Montant</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4">Emission</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id} className="border-t border-slate-100">
                <td className="px-6 py-4 font-semibold text-slate-700">
                  {invoice.invoiceNumber || 'DRAFT'}
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-800">
                    {invoice.clientName || 'Client'}
                  </div>
                  <div className="text-xs text-slate-400">
                    {invoice.clientEmail}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {invoice.totalTtc?.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'TND',
                  }) || '0.00 TND'}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      statusStyles[invoice.status]
                    }`}
                  >
                    {invoice.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {invoice.issueDate
                    ? new Date(invoice.issueDate).toLocaleDateString('fr-FR')
                    : '-'}
                </td>
              </tr>
            ))}
            {!loading && filteredInvoices.length === 0 ? (
              <tr>
                <td
                  className="px-6 py-6 text-center text-sm text-slate-400"
                  colSpan={5}
                >
                  Aucune facture ne correspond aux filtres.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
          disabled={page === 0}
          className="rounded-2xl border border-white/70 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-card disabled:cursor-not-allowed disabled:opacity-50"
        >
          Precedent
        </button>
        <button
          type="button"
          onClick={() =>
            setPage((prev) => (prev + 1 < totalPages ? prev + 1 : prev))
          }
          disabled={page + 1 >= totalPages}
          className="rounded-2xl border border-white/70 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-card disabled:cursor-not-allowed disabled:opacity-50"
        >
          Suivant
        </button>
      </div>
    </div>
  );
};

export default Invoices;
