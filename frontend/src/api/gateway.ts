import type {
  Invoice,
  InvoicePage,
  InvoicePayload,
  NotificationPreferences,
  Payment,
} from './types';

export type {
  InvoiceStatus,
  InvoiceItemPayload,
  InvoicePayload,
  Invoice,
  InvoicePage,
  PaymentStatus,
  Payment,
  NotificationPreferences,
} from './types';

const rawBase =
  process.env.REACT_APP_API_URL?.trim() ||
  process.env.REACT_APP_API_BASE_URL?.trim();
const fallbackBase =
  typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080';
const baseCandidate = rawBase && rawBase.length ? rawBase : fallbackBase;
const API_BASE = baseCandidate.replace(/\/+$/, '').replace(/\/api$/, '');

const getAuthHeaders = (): Record<string, string> => {
  const token =
    localStorage.getItem('access_token') ||
    localStorage.getItem('jwt_token') ||
    '';
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string>),
  };
  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!response.ok) {
    const text = await response.text();
    let msg = text;
    try {
      const json = JSON.parse(text) as { message?: string; error?: string };
      msg = json.message || json.error || text;
    } catch { /* keep text as-is */ }
    throw new Error(msg || 'Erreur API');
  }
  const contentLength = response.headers.get('content-length');
  if (response.status === 204 || contentLength === '0') {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export const getInvoices = async ({
  ownerUserId,
  page = 0,
  size = 10,
}: {
  ownerUserId?: string;
  page?: number;
  size?: number;
} = {}): Promise<InvoicePage> => {
  const url = new URL(`${API_BASE}/api/invoices`);
  if (ownerUserId) {
    url.searchParams.set('ownerUserId', ownerUserId);
  }
  url.searchParams.set('page', String(page));
  url.searchParams.set('size', String(size));
  return apiFetch<InvoicePage>(url.pathname + url.search);
};

export const getPayments = async (): Promise<Payment[]> => {
  return apiFetch<Payment[]>('/api/payments');
};

export const createInvoice = async (
  payload: InvoicePayload
): Promise<Invoice> => {
  return apiFetch<Invoice>('/api/invoices', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  return apiFetch<NotificationPreferences>('/api/notifications/preferences');
};

export const updateNotificationPreferences = async (
  prefs: NotificationPreferences
): Promise<NotificationPreferences> => {
  return apiFetch<NotificationPreferences>('/api/notifications/preferences', {
    method: 'PUT',
    body: JSON.stringify(prefs),
  });
};

export const sendTestNotificationEmail = async (email: string): Promise<void> => {
  return apiFetch<void>(
    `/api/notifications/test-email?to=${encodeURIComponent(email)}`,
    { method: 'POST' }
  );
};
