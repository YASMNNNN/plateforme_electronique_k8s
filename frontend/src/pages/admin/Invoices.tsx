import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getInvoices,
  deleteInvoice,
  validateInvoice,
  sendInvoice,
  cancelInvoice,
  downloadInvoicePdf,
  Invoice,
  InvoiceStatus,
} from '../../api/gateway';

const statusStyles: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  VALIDATED: 'bg-amber-100 text-amber-700',
  SENT: 'bg-blue-100 text-blue-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
};

type ConfirmModalProps = {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmModal = ({ message, onConfirm, onCancel }: ConfirmModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="w-full max-w-sm rounded-3xl border border-white/80 bg-white p-6 shadow-card">
      <p className="mb-6 text-sm text-slate-700">{message}</p>
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white"
        >
          Confirmer
        </button>
      </div>
    </div>
  </div>
);

const Invoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmAction, setConfirmAction] = useState<{
    message: string;
    action: () => Promise<void>;
  } | null>(null);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getInvoices({ page, size: 10 });
      setInvoices(response.content);
      setTotalPages(response.totalPages || 1);
      setError('');
    } catch {
      setInvoices([]);
      setTotalPages(1);
      setError("Impossible de charger les factures via l'API Gateway.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const response = await getInvoices({ page, size: 10 });
        if (!isMounted) return;
        setInvoices(response.content);
        setTotalPages(response.totalPages || 1);
        setError('');
      } catch {
        if (!isMounted) return;
        setInvoices([]);
        setTotalPages(1);
        setError("Impossible de charger les factures via l'API Gateway.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [page]);

  const runAction = async (action: () => Promise<void>) => {
    try {
      await action();
      await loadInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'action.');
    }
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    await runAction(confirmAction.action);
    setConfirmAction(null);
  };

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
      {confirmAction && (
        <ConfirmModal
          message={confirmAction.message}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}

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
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id} className="border-t border-slate-100">
                <td className="px-6 py-4 font-semibold text-slate-700">
                  <Link
                    to={`/admin/invoices/${invoice.id}`}
                    className="hover:text-ink-500 hover:underline"
                  >
                    {invoice.invoiceNumber || 'DRAFT'}
                  </Link>
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
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/invoices/${invoice.id}`)}
                      className="rounded-xl px-2 py-1 text-xs font-semibold text-ink-500 hover:bg-ink-50"
                    >
                      Voir
                    </button>

                    {invoice.status === 'DRAFT' && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/admin/invoices/${invoice.id}/edit`)
                          }
                          className="rounded-xl px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            runAction(() => validateInvoice(invoice.id).then(() => {}))
                          }
                          className="rounded-xl px-2 py-1 text-xs font-semibold text-amber-600 hover:bg-amber-50"
                        >
                          Valider
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmAction({
                              message: `Supprimer la facture ${invoice.invoiceNumber || 'brouillon'} ?`,
                              action: () => deleteInvoice(invoice.id),
                            })
                          }
                          className="rounded-xl px-2 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-50"
                        >
                          Supprimer
                        </button>
                      </>
                    )}

                    {invoice.status === 'VALIDATED' && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            runAction(() => sendInvoice(invoice.id).then(() => {}))
                          }
                          className="rounded-xl px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                        >
                          Envoyer
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmAction({
                              message: `Annuler la facture ${invoice.invoiceNumber} ?`,
                              action: () => cancelInvoice(invoice.id).then(() => {}),
                            })
                          }
                          className="rounded-xl px-2 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-50"
                        >
                          Annuler
                        </button>
                      </>
                    )}

                    {invoice.status === 'SENT' && (
                      <>
                        <button
                          type="button"
                          onClick={() => downloadInvoicePdf(invoice.id)}
                          className="rounded-xl px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                        >
                          PDF
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmAction({
                              message: `Annuler la facture ${invoice.invoiceNumber} ?`,
                              action: () => cancelInvoice(invoice.id).then(() => {}),
                            })
                          }
                          className="rounded-xl px-2 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-50"
                        >
                          Annuler
                        </button>
                      </>
                    )}

                    {invoice.status === 'PAID' && (
                      <button
                        type="button"
                        onClick={() => downloadInvoicePdf(invoice.id)}
                        className="rounded-xl px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                      >
                        PDF
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filteredInvoices.length === 0 ? (
              <tr>
                <td
                  className="px-6 py-6 text-center text-sm text-slate-400"
                  colSpan={6}
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
