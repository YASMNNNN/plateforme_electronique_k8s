import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createInvoice } from '../../api/gateway';
import { useAuth } from '../../contexts/AuthContext';

type LineItem = {
  description: string;
  quantity: string;
  unitPrice: string;
  taxRate: string;
};

const InvoiceCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [vatRate, setVatRate] = useState('19');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<LineItem[]>([
    { description: '', quantity: '1', unitPrice: '0', taxRate: '0' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleItemChange = (
    index: number,
    field: keyof LineItem,
    value: string
  ) => {
    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { description: '', quantity: '1', unitPrice: '0', taxRate: '0' },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback('');

    try {
      await createInvoice({
        ownerUserId: user?.id ?? '',
        clientName,
        clientEmail,
        billingAddress,
        vatRate: Number(vatRate),
        issueDate: issueDate || undefined,
        dueDate: dueDate || undefined,
        items: items.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          taxRate: Number(item.taxRate) || 0,
        })),
      });
      setFeedback('Facture creee avec succes.');
      setTimeout(() => navigate('/admin/invoices'), 1200);
    } catch (error) {
      setFeedback('Erreur lors de la creation de la facture.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/80 bg-white p-6 shadow-card">
        <h2 className="font-display text-xl font-semibold text-ink-900">
          Creer une facture
        </h2>
        <p className="text-sm text-slate-500">
          Renseignez les details du client et les lignes de facturation.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-3xl border border-white/80 bg-white p-6 shadow-card"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-600">
            Nom du client
            <input
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-semibold text-slate-600">
            Email du client
            <input
              value={clientEmail}
              onChange={(event) => setClientEmail(event.target.value)}
              required
              type="email"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-semibold text-slate-600 md:col-span-2">
            Adresse de facturation
            <textarea
              value={billingAddress}
              onChange={(event) => setBillingAddress(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-semibold text-slate-600">
            TVA (%)
            <input
              value={vatRate}
              onChange={(event) => setVatRate(event.target.value)}
              type="number"
              min="0"
              step="0.1"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-semibold text-slate-600">
            Date d'emission
            <input
              value={issueDate}
              onChange={(event) => setIssueDate(event.target.value)}
              type="date"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-semibold text-slate-600">
            Date d'echeance
            <input
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              type="date"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
            />
          </label>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-ink-900">
              Lignes de facture
            </h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="rounded-2xl border border-ink-200 bg-ink-50 px-4 py-2 text-xs font-semibold text-ink-700"
            >
              Ajouter une ligne
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={`item-${index}`}
                className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-[2fr_repeat(3,1fr)_auto]"
              >
                <input
                  value={item.description}
                  onChange={(event) =>
                    handleItemChange(index, 'description', event.target.value)
                  }
                  placeholder="Description"
                  required
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                />
                <input
                  value={item.quantity}
                  onChange={(event) =>
                    handleItemChange(index, 'quantity', event.target.value)
                  }
                  type="number"
                  min="0.001"
                  step="0.001"
                  placeholder="Quantite"
                  required
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                />
                <input
                  value={item.unitPrice}
                  onChange={(event) =>
                    handleItemChange(index, 'unitPrice', event.target.value)
                  }
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Prix unitaire"
                  required
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                />
                <input
                  value={item.taxRate}
                  onChange={(event) =>
                    handleItemChange(index, 'taxRate', event.target.value)
                  }
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Taxe"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  disabled={items.length === 1}
                  className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        </div>

        {feedback ? (
          <div className="rounded-2xl border border-ink-100 bg-ink-50 px-4 py-3 text-sm text-ink-700">
            {feedback}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-2xl bg-ink-500 px-6 py-3 text-sm font-semibold text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Creation...' : 'Enregistrer la facture'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/invoices')}
            className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceCreate;
