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

-- ============================================================
-- Invoices for user@example.com (22222222-2222-2222-2222-222222222222)
-- ============================================================

INSERT INTO invoices (
    id, invoice_number, owner_user_id,
    client_name, client_email, billing_address,
    subtotal_ht, vat_rate, vat_amount, total_ttc,
    status, issue_date, due_date, created_at, updated_at
) VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001',
    'FAC-2026-00010',
    '22222222-2222-2222-2222-222222222222',
    'Cafe Central SARL',
    'comptabilite@cafecentral.tn',
    '25 Rue de la Liberte, Tunis',
    3500.0000, 19.00, 665.0000, 4165.0000,
    'PAID',
    '2026-01-08', '2026-02-08',
    '2026-01-08 08:30:00', '2026-01-25 14:00:00'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO invoices (
    id, invoice_number, owner_user_id,
    client_name, client_email, billing_address,
    subtotal_ht, vat_rate, vat_amount, total_ttc,
    status, issue_date, due_date, created_at, updated_at
) VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa002',
    'FAC-2026-00011',
    '22222222-2222-2222-2222-222222222222',
    'Boutique Medina',
    'info@boutiquemedina.tn',
    '12 Souk El Attarine, Tunis',
    1800.0000, 19.00, 342.0000, 2142.0000,
    'SENT',
    '2026-02-01', '2026-03-01',
    '2026-02-01 10:15:00', '2026-02-01 10:15:00'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO invoices (
    id, invoice_number, owner_user_id,
    client_name, client_email, billing_address,
    subtotal_ht, vat_rate, vat_amount, total_ttc,
    status, issue_date, due_date, created_at, updated_at
) VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa003',
    NULL,
    '22222222-2222-2222-2222-222222222222',
    'Transport Express',
    'facturation@transexpress.tn',
    'Zone Industrielle, Sousse',
    5200.0000, 19.00, 988.0000, 6188.0000,
    'DRAFT',
    '2026-02-15', '2026-03-15',
    '2026-02-15 09:00:00', NULL
) ON CONFLICT (id) DO NOTHING;

-- Items for Cafe Central invoice
INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, tax_rate, line_total_ht)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbb0001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001',
        'Creation site vitrine', 1.000, 2500.0000, 19.00, 2500.0000) ON CONFLICT (id) DO NOTHING;

INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, tax_rate, line_total_ht)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbb0002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001',
        'Maintenance mensuelle', 2.000, 500.0000, 19.00, 1000.0000) ON CONFLICT (id) DO NOTHING;

-- Items for Boutique Medina invoice
INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, tax_rate, line_total_ht)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbb0003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa002',
        'Design logo et charte graphique', 1.000, 800.0000, 19.00, 800.0000) ON CONFLICT (id) DO NOTHING;

INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, tax_rate, line_total_ht)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbb0004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa002',
        'Cartes de visite (500 pcs)', 1.000, 200.0000, 19.00, 200.0000) ON CONFLICT (id) DO NOTHING;

INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, tax_rate, line_total_ht)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbb0005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa002',
        'Flyers promotionnels (1000 pcs)', 1.000, 800.0000, 19.00, 800.0000) ON CONFLICT (id) DO NOTHING;

-- Items for Transport Express invoice (draft)
INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, tax_rate, line_total_ht)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbb0006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa003',
        'Developpement application de suivi', 1.000, 4000.0000, 19.00, 4000.0000) ON CONFLICT (id) DO NOTHING;

INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, tax_rate, line_total_ht)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbb0007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa003',
        'Formation equipe (2 jours)', 2.000, 600.0000, 19.00, 1200.0000) ON CONFLICT (id) DO NOTHING;
