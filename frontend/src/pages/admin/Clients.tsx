import React, { useEffect, useMemo, useState } from 'react';
import { getInvoices, Invoice } from '../../api/gateway';

const Clients = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const response = await getInvoices({
          page: 0,
          size: 50,
        });
        if (isMounted) {
          setInvoices(response.content);
          setError('');
        }
      } catch {
        if (isMounted) {
          setInvoices([]);
          setError(
            "Impossible de charger les clients via l'API Gateway."
          );
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const clients = useMemo(() => {
    const map = new Map<string, { name: string; email: string; invoices: number }>();
    invoices.forEach((invoice) => {
      const key = invoice.clientEmail || invoice.clientName || 'client';
      const existing = map.get(key);
      if (existing) {
        existing.invoices += 1;
      } else {
        map.set(key, {
          name: invoice.clientName || 'Client',
          email: invoice.clientEmail || '-',
          invoices: 1,
        });
      }
    });
    return Array.from(map.values());
  }, [invoices]);

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
      ) : null}
      <div className="rounded-3xl border border-white/80 bg-white p-6 shadow-card">
        <h2 className="font-display text-xl font-semibold text-ink-900">
          Clients
        </h2>
        <p className="text-sm text-slate-500">
          Vue consolidee des clients actifs.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/80 bg-white shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-400">
            <tr>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Factures</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.email} className="border-t border-slate-100">
                <td className="px-6 py-4 font-semibold text-slate-800">
                  {client.name}
                </td>
                <td className="px-6 py-4 text-slate-500">{client.email}</td>
                <td className="px-6 py-4 text-slate-600">
                  {client.invoices}
                </td>
              </tr>
            ))}
            {clients.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-6 text-center text-sm text-slate-400"
                >
                  Aucun client a afficher.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Clients;
