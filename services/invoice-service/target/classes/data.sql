INSERT INTO invoices (
    id,
    invoice_number,
    owner_user_id,
    client_name,
    client_email,
    billing_address,
    subtotal_ht,
    vat_rate,
    vat_amount,
    total_ttc,
    status,
    issue_date,
    due_date,
    created_at,
    updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111101',
    'INV-2026-0001',
    '11111111-1111-1111-1111-111111111111',
    'Societe Atlas',
    'contact@atlas.tn',
    'Tunis, TN',
    100.0000,
    19.00,
    19.0000,
    119.0000,
    'SENT',
    '2026-01-10',
    '2026-01-20',
    '2026-01-10 09:00:00',
    '2026-01-10 09:00:00'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO invoices (
    id,
    invoice_number,
    owner_user_id,
    client_name,
    client_email,
    billing_address,
    subtotal_ht,
    vat_rate,
    vat_amount,
    total_ttc,
    status,
    issue_date,
    due_date,
    created_at,
    updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111102',
    'INV-2026-0002',
    '11111111-1111-1111-1111-111111111111',
    'Delta Services',
    'finance@delta.tn',
    'Sfax, TN',
    250.0000,
    19.00,
    47.5000,
    297.5000,
    'PAID',
    '2026-01-05',
    '2026-01-15',
    '2026-01-05 10:30:00',
    '2026-01-08 16:20:00'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO invoice_items (
    id,
    invoice_id,
    description,
    quantity,
    unit_price,
    tax_rate,
    line_total_ht
) VALUES (
    '11111111-1111-1111-1111-111111111201',
    '11111111-1111-1111-1111-111111111101',
    'Audit et conseil',
    1.000,
    60.0000,
    19.00,
    60.0000
) ON CONFLICT (id) DO NOTHING;

INSERT INTO invoice_items (
    id,
    invoice_id,
    description,
    quantity,
    unit_price,
    tax_rate,
    line_total_ht
) VALUES (
    '11111111-1111-1111-1111-111111111202',
    '11111111-1111-1111-1111-111111111101',
    'Integration plateforme',
    1.000,
    40.0000,
    19.00,
    40.0000
) ON CONFLICT (id) DO NOTHING;

INSERT INTO invoice_items (
    id,
    invoice_id,
    description,
    quantity,
    unit_price,
    tax_rate,
    line_total_ht
) VALUES (
    '11111111-1111-1111-1111-111111111203',
    '11111111-1111-1111-1111-111111111102',
    'Abonnement annuel',
    1.000,
    250.0000,
    19.00,
    250.0000
) ON CONFLICT (id) DO NOTHING;
