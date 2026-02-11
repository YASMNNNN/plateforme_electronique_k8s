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

export type NotificationPreferences = {
  email: string;
  emailEnabled: boolean;
  paymentAlertsEnabled: boolean;
  invoiceAlertsEnabled: boolean;
};
