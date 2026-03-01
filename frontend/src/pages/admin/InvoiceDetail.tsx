import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getInvoice,
  deleteInvoice,
  validateInvoice,
  sendInvoice,
  cancelInvoice,
  markInvoicePaid,
  downloadInvoicePdf,
  Invoice,
  InvoiceStatus,
} from '../../api/gateway';
import { usePermission } from '../../hooks/usePermission';

const statusStyles: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  VALIDATED: 'bg-amber-100 text-amber-700',
  SENT: 'bg-blue-100 text-blue-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
};

const statusLabels: Record<InvoiceStatus, string> = {
  DRAFT: 'Brouillon',
  VALIDATED: 'Validee',
  SENT: 'Envoyee',
  PAID: 'Payee',
  CANCELLED: 'Annulee',
};

const InvoiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can, isAdmin, userId } = usePermission();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmAction, setConfirmAction] = useState<{
    message: string;
    action: () => Promise<void>;
  } | null>(null);

  const ownerUserId = isAdmin ? undefined : userId;
  const canValidate = can('invoices.validate');
  const canDelete = can('invoices.delete');
  const canMarkPaid = can('invoices.markPaid');

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getInvoice(id, ownerUserId);
        if (!isMounted) return;
        setInvoice(data);
        setError('');
      } catch {
        if (!isMounted) return;
        setError('Impossible de charger la facture.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [id, ownerUserId]);

  const runAction = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'action.");
    }
  };

  const handleValidate = () => {
    if (!id) return;
    runAction(async () => {
      const updated = await validateInvoice(id, ownerUserId);
      setInvoice(updated);
    });
  };

  const handleSend = () => {
    if (!id) return;
    runAction(async () => {
      const updated = await sendInvoice(id, ownerUserId);
      setInvoice(updated);
    });
  };

  const handleDelete = () => {
    if (!id) return;
    setConfirmAction({
      message: `Supprimer la facture ${invoice?.invoiceNumber || 'brouillon'} ?`,
      action: async () => {
        await deleteInvoice(id, ownerUserId);
        navigate('/admin/invoices');
      },
    });
  };

  const handleCancel = () => {
    if (!id) return;
    setConfirmAction({
      message: `Annuler la facture ${invoice?.invoiceNumber} ?`,
      action: async () => {
        const updated = await cancelInvoice(id, ownerUserId);
        setInvoice(updated);
      },
    });
  };

  const handleMarkPaid = () => {
    if (!id) return;
    setConfirmAction({
      message: `Marquer la facture ${invoice?.invoiceNumber} comme payee ?`,
      action: async () => {
        const updated = await markInvoicePaid(id);
        setInvoice(updated);
      },
    });
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    await runAction(confirmAction.action);
    setConfirmAction(null);
  };

  const handleDownloadPdf = () => {
    if (!id) return;
    downloadInvoicePdf(id, ownerUserId);
  };

  const formatCurrency = (value?: number) =>
    value?.toLocaleString('fr-FR', { style: 'currency', currency: 'TND' }) ??
    '0,00 TND';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-slate-400">
        Chargement...
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
        <Link
          to="/admin/invoices"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
        >
          Retour
        </Link>
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div className="space-y-6">
      {/* Confirm modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-3xl border border-white/80 bg-white p-6 shadow-card">
            <p className="mb-6 text-sm text-slate-700">
              {confirmAction.message}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 rounded-3xl border border-white/80 bg-white p-6 shadow-card md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate-500">Facture</p>
          <h2 className="font-display text-xl font-semibold text-ink-900">
            {invoice.invoiceNumber || 'BROUILLON'}
          </h2>
          <div className="mt-1 flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[invoice.status]}`}
            >
              {statusLabels[invoice.status]}
            </span>
            <span className="text-sm text-slate-500">
              {invoice.clientName}
            </span>
            {invoice.clientEmail && (
              <span className="text-xs text-slate-400">
                ({invoice.clientEmail})
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {invoice.status === 'DRAFT' && (
            <>
              <Link
                to={`/admin/invoices/${invoice.id}/edit`}
                className="rounded-2xl bg-ink-500 px-4 py-2 text-sm font-semibold text-white shadow-soft"
              >
                Modifier
              </Link>
              {canValidate && (
                <button
                  type="button"
                  onClick={handleValidate}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  Valider
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  Supprimer
                </button>
              )}
            </>
          )}
          {invoice.status === 'VALIDATED' && (
            <>
              <button
                type="button"
                onClick={handleSend}
                className="rounded-2xl bg-ink-500 px-4 py-2 text-sm font-semibold text-white shadow-soft"
              >
                Envoyer
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Annuler
              </button>
            </>
          )}
          {invoice.status === 'SENT' && (
            <>
              {canMarkPaid && (
                <button
                  type="button"
                  onClick={handleMarkPaid}
                  className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-soft"
                >
                  Marquer comme payee
                </button>
              )}
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="rounded-2xl bg-ink-500 px-4 py-2 text-sm font-semibold text-white shadow-soft"
              >
                Telecharger PDF
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Annuler
              </button>
            </>
          )}
          {invoice.status === 'PAID' && (
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="rounded-2xl bg-ink-500 px-4 py-2 text-sm font-semibold text-white shadow-soft"
            >
              Telecharger PDF
            </button>
          )}
          {invoice.status === 'CANCELLED' && canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Supprimer
            </button>
          )}
          <Link
            to="/admin/invoices"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
          >
            Retour
          </Link>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-white/80 bg-white p-6 shadow-card">
          <h3 className="mb-4 font-display text-lg font-semibold text-ink-900">
            Informations
          </h3>
          <dl className="space-y-3 text-sm">
            {invoice.billingAddress && (
              <div>
                <dt className="font-semibold text-slate-500">Adresse de facturation</dt>
                <dd className="text-slate-700 whitespace-pre-line">{invoice.billingAddress}</dd>
              </div>
            )}
            <div>
              <dt className="font-semibold text-slate-500">Date d'emission</dt>
              <dd className="text-slate-700">
                {invoice.issueDate
                  ? new Date(invoice.issueDate).toLocaleDateString('fr-FR')
                  : '-'}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Date d'echeance</dt>
              <dd className="text-slate-700">
                {invoice.dueDate
                  ? new Date(invoice.dueDate).toLocaleDateString('fr-FR')
                  : '-'}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Taux TVA</dt>
              <dd className="text-slate-700">
                {invoice.vatRate != null ? `${invoice.vatRate}%` : '-'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-3xl border border-white/80 bg-white p-6 shadow-card">
          <h3 className="mb-4 font-display text-lg font-semibold text-ink-900">
            Totaux
          </h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="font-semibold text-slate-500">Sous-total HT</dt>
              <dd className="text-slate-700">{formatCurrency(invoice.subtotalHt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-semibold text-slate-500">TVA</dt>
              <dd className="text-slate-700">{formatCurrency(invoice.vatAmount)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3">
              <dt className="font-semibold text-ink-900">Total TTC</dt>
              <dd className="font-semibold text-ink-900">
                {formatCurrency(invoice.totalTtc)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Items table */}
      {invoice.items && invoice.items.length > 0 && (
        <div className="overflow-hidden rounded-3xl border border-white/80 bg-white shadow-card">
          <div className="px-6 pt-6">
            <h3 className="font-display text-lg font-semibold text-ink-900">
              Lignes de facture
            </h3>
          </div>
          <table className="mt-4 w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Quantite</th>
                <th className="px-6 py-3">Prix unitaire</th>
                <th className="px-6 py-3">Taxe</th>
                <th className="px-6 py-3">Total HT</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-6 py-3 text-slate-700">{item.description}</td>
                  <td className="px-6 py-3 text-slate-600">{item.quantity}</td>
                  <td className="px-6 py-3 text-slate-600">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-6 py-3 text-slate-600">
                    {item.taxRate != null ? `${item.taxRate}%` : '-'}
                  </td>
                  <td className="px-6 py-3 font-semibold text-slate-700">
                    {formatCurrency(item.lineTotalHt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;
