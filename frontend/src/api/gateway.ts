const rawBase =
  process.env.REACT_APP_API_URL?.trim() ||
  process.env.REACT_APP_API_BASE_URL?.trim();
const fallbackBase =
  typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080';
const baseCandidate = rawBase && rawBase.length ? rawBase : fallbackBase;
const API_BASE = baseCandidate.replace(/\/+$/, '').replace(/\/api$/, '');

export type InvoiceStatus =
  | 'DRAFT'
  | 'VALIDATED'
  | 'SENT'
  | 'PAID'
  | 'CANCELLED';

export type InvoiceItemPayload = {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
};

export type InvoicePayload = {
  ownerUserId: string;
  clientName: string;
  clientEmail: string;
  billingAddress?: string;
  vatRate?: number;
  issueDate?: string;
  dueDate?: string;
  items: InvoiceItemPayload[];
};

export type Invoice = {
  id: string;
  invoiceNumber?: string;
  clientName?: string;
  clientEmail?: string;
  billingAddress?: string;
  subtotalHt?: number;
  vatRate?: number;
  vatAmount?: number;
  totalTtc?: number;
  status: InvoiceStatus;
  issueDate?: string;
  dueDate?: string;
  createdAt?: string;
};

export type InvoicePage = {
  content: Invoice[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export type Payment = {
  id: string;
  reference: string;
  invoiceId: string;
  userId: string;
  amount: number;
  currency: string;
  method: 'CARD' | 'BANK_TRANSFER' | 'CASH' | 'CHECK';
  status: PaymentStatus;
  paymentDate?: string;
  createdAt?: string;
};

const parseJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Erreur API');
  }
  return response.json() as Promise<T>;
};

const getAuthHeaders = (): Record<string, string> => {
  const token =
    localStorage.getItem('access_token') ||
    localStorage.getItem('jwt_token') ||
    '';
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getInvoices = async ({
  ownerUserId,
  page = 0,
  size = 10,
}: {
  ownerUserId: string;
  page?: number;
  size?: number;
}): Promise<InvoicePage> => {
  const url = new URL(`${API_BASE}/api/invoices`);
  url.searchParams.set('ownerUserId', ownerUserId);
  url.searchParams.set('page', String(page));
  url.searchParams.set('size', String(size));
  return parseJson<InvoicePage>(
    await fetch(url.toString(), {
      headers: {
        ...getAuthHeaders(),
      },
    })
  );
};

export const getPayments = async (): Promise<Payment[]> => {
  return parseJson<Payment[]>(
    await fetch(`${API_BASE}/api/payments`, {
      headers: {
        ...getAuthHeaders(),
      },
    })
  );
};

export const createInvoice = async (
  payload: InvoicePayload
): Promise<Invoice> => {
  return parseJson<Invoice>(
    await fetch(`${API_BASE}/api/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    })
  );
};
