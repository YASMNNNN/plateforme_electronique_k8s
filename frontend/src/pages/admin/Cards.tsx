import React, { useCallback, useEffect, useState } from 'react';
import { getCards, createCard, deleteCard } from '../../api/gateway';
import type { Card, CardPayload } from '../../api/gateway';

const DEMO_USER_ID = '11111111-1111-1111-1111-111111111111';

const emptyForm: CardPayload = {
  userId: DEMO_USER_ID,
  cardHolderName: '',
  lastFourDigits: '',
  cardBrand: '',
  expiryMonth: undefined,
  expiryYear: undefined,
};

const Cards = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CardPayload>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCards(DEMO_USER_ID);
      setCards(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'expiryMonth' || name === 'expiryYear' ? Number(value) || undefined : value,
    }));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await createCard(form);
      setForm(emptyForm);
      setShowForm(false);
      setSuccess('Carte ajoutee avec succes.');
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cette carte ?')) return;
    setError('');
    setSuccess('');
    try {
      await deleteCard(id);
      setSuccess('Carte supprimee.');
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12 text-slate-500">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-slate-900">Cartes de paiement</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:shadow-lg">
          {showForm ? 'Annuler' : 'Ajouter une carte'}
        </button>
      </div>

      {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>}
      {success && <div className="rounded-xl bg-green-50 p-4 text-sm text-green-600">{success}</div>}

      {showForm && (
        <form onSubmit={handleAdd} className="rounded-2xl bg-white p-6 shadow-card space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Titulaire</span>
              <input name="cardHolderName" value={form.cardHolderName} onChange={handleChange} required
                className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">4 derniers chiffres</span>
              <input name="lastFourDigits" value={form.lastFourDigits} onChange={handleChange} required
                maxLength={4} minLength={4} pattern="\d{4}"
                className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Marque</span>
              <input name="cardBrand" value={form.cardBrand ?? ''} onChange={handleChange}
                placeholder="VISA, Mastercard..."
                className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Mois exp.</span>
                <input name="expiryMonth" type="number" min={1} max={12}
                  value={form.expiryMonth ?? ''} onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Annee exp.</span>
                <input name="expiryYear" type="number" min={2024} max={2040}
                  value={form.expiryYear ?? ''} onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </label>
            </div>
          </div>
          <button type="submit"
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:shadow-lg">
            Enregistrer
          </button>
        </form>
      )}

      {cards.length === 0 ? (
        <p className="text-sm text-slate-500">Aucune carte enregistree.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(card => (
            <div key={card.id} className="flex flex-col justify-between rounded-2xl bg-white p-5 shadow-card">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{card.cardBrand || 'Carte'}</span>
                  {card.isDefault && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Par defaut</span>
                  )}
                </div>
                <p className="mt-2 text-lg tracking-wider text-slate-700">**** **** **** {card.lastFourDigits}</p>
                <p className="text-sm text-slate-500">{card.cardHolderName}</p>
                {card.expiryMonth && card.expiryYear && (
                  <p className="text-sm text-slate-400">Expire {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}</p>
                )}
              </div>
              <button onClick={() => handleDelete(card.id)}
                className="mt-4 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Cards;
