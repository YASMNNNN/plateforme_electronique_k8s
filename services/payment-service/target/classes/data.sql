INSERT INTO payments (
    id,
    reference,
    invoice_id,
    user_id,
    amount,
    currency,
    method,
    status,
    external_transaction_id,
    payment_date,
    created_at
) VALUES (
    '11111111-1111-1111-1111-111111112001',
    'PAY-2026-0001',
    '11111111-1111-1111-1111-111111111102',
    '11111111-1111-1111-1111-111111111111',
    297.5000,
    'TND',
    'CARD',
    'COMPLETED',
    'TX-2026-0001',
    '2026-01-08',
    '2026-01-08 16:25:00'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payments (
    id,
    reference,
    invoice_id,
    user_id,
    amount,
    currency,
    method,
    status,
    external_transaction_id,
    payment_date,
    created_at
) VALUES (
    '11111111-1111-1111-1111-111111112002',
    'PAY-2026-0002',
    '11111111-1111-1111-1111-111111111101',
    '11111111-1111-1111-1111-111111111111',
    119.0000,
    'TND',
    'BANK_TRANSFER',
    'PENDING',
    'TX-2026-0002',
    NULL,
    '2026-01-12 11:10:00'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payments (
    id,
    reference,
    invoice_id,
    user_id,
    amount,
    currency,
    method,
    status,
    external_transaction_id,
    payment_date,
    created_at
) VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'PAY-2026-0003',
    '11111111-1111-1111-1111-111111111111',
    'c30182ab-cc6a-4af0-8be4-db2f6e8b5ebb',
    17850.0000,
    'TND',
    'BANK_TRANSFER',
    'COMPLETED',
    'TX-2026-0003',
    '2026-01-10',
    '2026-01-10 10:00:00'
) ON CONFLICT (id) DO NOTHING;
