import type {
  Card,
  CardPayload,
  CreateSubscriptionPayload,
  Invoice,
  InvoiceItem,
  InvoicePage,
  InvoicePayload,
  InvoiceStatus,
  MerchantInvoiceStats,
  Notification,
  NotificationPreferences,
  Payment,
  Plan,
  Subscription,
  UpdateUserPayload,
  UserProfile,
} from './types';

export type {
  InvoiceStatus,
  InvoiceItem,
  InvoiceItemPayload,
  InvoicePayload,
  Invoice,
  InvoicePage,
  PaymentStatus,
  Payment,
  NotificationPreferences,
  UserProfile,
  UpdateUserPayload,
  UserPage,
  Card,
  CardPayload,
  Subscription,
  CreateSubscriptionPayload,
  Plan,
  SubscriptionStatus,
  PlanName,
  Notification,
  NotificationType,
  CreateNotificationRequest,
  MerchantInvoiceStats,
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
  status,
  page = 0,
  size = 10,
}: {
  ownerUserId?: string;
  status?: InvoiceStatus;
  page?: number;
  size?: number;
} = {}): Promise<InvoicePage> => {
  const url = new URL(`${API_BASE}/api/invoices`);
  if (ownerUserId) {
    url.searchParams.set('ownerUserId', ownerUserId);
  }
  if (status) {
    url.searchParams.set('status', status);
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

const OWNER_USER_ID = '11111111-1111-1111-1111-111111111111';

export const getInvoice = async (id: string, ownerUserId?: string): Promise<Invoice> => {
  const params = ownerUserId ? `?ownerUserId=${ownerUserId}` : '';
  return apiFetch<Invoice>(`/api/invoices/${id}${params}`);
};

export const updateInvoice = async (
  id: string,
  payload: InvoicePayload
): Promise<Invoice> => {
  return apiFetch<Invoice>(`/api/invoices/${id}?ownerUserId=${OWNER_USER_ID}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const deleteInvoice = async (id: string): Promise<void> => {
  return apiFetch<void>(`/api/invoices/${id}?ownerUserId=${OWNER_USER_ID}`, {
    method: 'DELETE',
  });
};

export const validateInvoice = async (id: string): Promise<Invoice> => {
  return apiFetch<Invoice>(
    `/api/invoices/${id}/validate?ownerUserId=${OWNER_USER_ID}`,
    { method: 'POST' }
  );
};

export const sendInvoice = async (id: string): Promise<Invoice> => {
  return apiFetch<Invoice>(
    `/api/invoices/${id}/send?ownerUserId=${OWNER_USER_ID}`,
    { method: 'POST' }
  );
};

export const cancelInvoice = async (id: string): Promise<Invoice> => {
  return apiFetch<Invoice>(
    `/api/invoices/${id}/cancel?ownerUserId=${OWNER_USER_ID}`,
    { method: 'POST' }
  );
};

export const downloadInvoicePdf = async (id: string): Promise<void> => {
  const headers = getAuthHeaders();
  const response = await fetch(
    `${API_BASE}/api/invoices/${id}/pdf?ownerUserId=${OWNER_USER_ID}`,
    { headers }
  );
  if (!response.ok) {
    throw new Error('Erreur lors du telechargement du PDF');
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `facture-${id}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

/* ── User / Profile ── */

export const getCurrentUser = async (): Promise<UserProfile> => {
  return apiFetch<UserProfile>('/api/users/me');
};

export const updateUser = async (
  id: string,
  payload: UpdateUserPayload
): Promise<UserProfile> => {
  return apiFetch<UserProfile>(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const deleteUser = async (id: string): Promise<void> => {
  return apiFetch<void>(`/api/users/${id}`, { method: 'DELETE' });
};

/* ── Cards ── */

export const getCards = async (userId: string): Promise<Card[]> => {
  return apiFetch<Card[]>(`/api/cards?userId=${userId}`);
};

export const createCard = async (payload: CardPayload): Promise<Card> => {
  return apiFetch<Card>('/api/cards', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const deleteCard = async (id: string): Promise<void> => {
  return apiFetch<void>(`/api/cards/${id}`, { method: 'DELETE' });
};

/* ── Subscriptions ── */

export const getPlans = async (): Promise<Plan[]> => {
  return apiFetch<Plan[]>('/api/plans');
};

export const createSubscription = async (
  payload: CreateSubscriptionPayload
): Promise<Subscription> => {
  return apiFetch<Subscription>('/api/subscriptions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const getSubscriptionByUser = async (
  userId: string
): Promise<Subscription> => {
  return apiFetch<Subscription>(`/api/subscriptions/user/${userId}`);
};

export const cancelSubscription = async (
  id: string
): Promise<Subscription> => {
  return apiFetch<Subscription>(`/api/subscriptions/${id}/cancel`, {
    method: 'POST',
  });
};

/* ── Notifications ── */

export const getNotifications = async (
  userId: string
): Promise<Notification[]> => {
  return apiFetch<Notification[]>(`/api/notifications/user/${userId}`);
};

export const deleteNotification = async (id: string): Promise<void> => {
  return apiFetch<void>(`/api/notifications/${id}`, { method: 'DELETE' });
};

export const markNotificationRead = async (
  id: string
): Promise<Notification> => {
  return apiFetch<Notification>(`/api/notifications/${id}/read`, {
    method: 'PATCH',
  });
};

/* ── Stats ── */

export const getMerchantStats = async (
  ownerUserId: string
): Promise<MerchantInvoiceStats> => {
  return apiFetch<MerchantInvoiceStats>(
    `/api/invoices/stats/${ownerUserId}`
  );
};
