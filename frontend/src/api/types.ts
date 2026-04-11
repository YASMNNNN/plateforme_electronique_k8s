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

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  lineTotalHt?: number;
};

export type Invoice = {
  id: string;
  ownerUserId?: string;
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
  items?: InvoiceItem[];
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

export type NotificationPreferences = {
  email: string;
  emailEnabled: boolean;
  paymentAlertsEnabled: boolean;
  invoiceAlertsEnabled: boolean;
};

/* ── Auth ── */

export type AuthResponse = {
  accessToken?: string;
  refreshToken?: string;
  expiresInSeconds?: number;
  mfaRequired?: boolean;
  mfaToken?: string;
  mfaExpiresInSeconds?: number;
};

export type MfaVerifyPayload = {
  mfaToken: string;
  code: string;
};

export type TotpSetupResponse = {
  secret: string;
  otpAuthUri: string;
  qrCodeDataUri: string;
};

export type RecoveryCodesResponse = {
  recoveryCodes: string[];
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  companyName?: string;
  taxId?: string;
  role?: string;
};

/* ── User / Profile ── */

export type UserProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  companyName?: string;
  taxId?: string;
  role: string;
  active: boolean;
  totpEnabled?: boolean;
};

export type UpdateUserPayload = {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  companyName?: string;
  taxId?: string;
};

export type UserPage = {
  content: UserProfile[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

/* ── Card ── */

export type Card = {
  id: string;
  userId: string;
  cardHolderName: string;
  lastFourDigits: string;
  cardBrand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  tokenReference?: string;
  createdAt?: string;
};

export type CardPayload = {
  userId: string;
  cardHolderName: string;
  lastFourDigits: string;
  cardBrand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault?: boolean;
  tokenReference?: string;
};

/* ── Subscription ── */

export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'SUSPENDED';
export type PlanName = 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';

export type Plan = {
  id: string;
  name: PlanName;
  description: string;
  priceMonthly?: number;
  priceAnnual?: number;
  maxInvoicesPerMonth?: number;
  maxUsers?: number;
  signatureIncluded: boolean;
  apiAccess: boolean;
};

export type Subscription = {
  id: string;
  userId: string;
  status: SubscriptionStatus;
  startDate?: string;
  endDate?: string;
  autoRenew: boolean;
  planId: string;
  planName: string;
  planDescription: string;
  priceMonthly?: number;
  priceAnnual?: number;
};

export type CreateSubscriptionPayload = {
  userId: string;
  planName: string;
  autoRenew?: boolean;
};

/* ── Notification ── */

export type NotificationType = 'INFO' | 'PAYMENT' | 'INVOICE' | 'SYSTEM';

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  read: boolean;
  createdAt?: string;
};

export type CreateNotificationRequest = {
  userId: string;
  type?: string;
  title: string;
  message?: string;
};

/* ── Change Password ── */

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

/* ── Merchant Invoice Stats ── */

export type MerchantInvoiceStats = {
  ownerUserId: string;
  totalInvoices: number;
  paidInvoices: number;
  draftInvoices: number;
  sentInvoices: number;
  totalRevenue: number;
};
