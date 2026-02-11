#!/bin/bash

# Script pour ajouter une facture avec statut au choix
# Auteur: yassmineg
# Date: 27 janvier 2026

echo "💳 Ajout d'une facture"
echo "============================="
echo ""

CONTAINER_NAME="plateforme-db"
DB_USER="plateforme_user"
DB_NAME="invoice_db"

# Vérifier le conteneur
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "❌ Conteneur PostgreSQL non lancé"
    echo "   Lancez d'abord: docker compose up -d"
    exit 1
fi

echo "✅ Conteneur PostgreSQL actif"
echo ""

# Informations facture
echo "📋 Informations de la facture:"
echo ""
read -p "Numéro de facture (ex: FAC-2026-001): " INVOICE_NUM
read -p "Nom du client: " CLIENT_NAME
read -p "Email du client: " CLIENT_EMAIL
read -p "Adresse du client: " ADDRESS
read -p "Montant HT (ex: 15000): " AMOUNT_HT

# Vérifier montant
if ! [[ "$AMOUNT_HT" =~ ^[0-9]+(\.[0-9]+)?$ ]]; then
    echo "❌ Erreur: Le montant doit être un nombre"
    exit 1
fi

# Choix du statut
echo ""
echo "📌 Statut de la facture:"
echo "1) PAID (Payée)"
echo "2) SENT (Envoyée)"
echo "3) VALIDATED (Validée)"
echo "4) DRAFT (Brouillon)"
echo "5) CANCELLED (Annulée)"
read -p "Choisissez le statut (1-5): " STATUS_CHOICE

case $STATUS_CHOICE in
  1) STATUS="PAID" ;;
  2) STATUS="SENT" ;;
  3) STATUS="VALIDATED" ;;
  4) STATUS="DRAFT" ;;
  5) STATUS="CANCELLED" ;;
  *)
    echo "❌ Statut invalide"
    exit 1
    ;;
esac

# Calcul TVA
VAT_RATE=19.00
VAT_AMOUNT=$(echo "$AMOUNT_HT * 0.19" | bc -l)
TOTAL_TTC=$(echo "$AMOUNT_HT + $VAT_AMOUNT" | bc -l)

VAT_AMOUNT=$(printf "%.2f" "$VAT_AMOUNT")
TOTAL_TTC=$(printf "%.2f" "$TOTAL_TTC")

# Résumé
echo ""
echo "📊 Résumé de la facture:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "N° Facture:    $INVOICE_NUM"
echo "Client:        $CLIENT_NAME"
echo "Email:         $CLIENT_EMAIL"
echo "Adresse:       $ADDRESS"
echo ""
echo "Montant HT:    $AMOUNT_HT TND"
echo "TVA (19%):     $VAT_AMOUNT TND"
echo "Total TTC:     $TOTAL_TTC TND"
echo "Statut:        $STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "Confirmer l'ajout de cette facture ? (y/n): " CONFIRM

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "❌ Annulé"
    exit 0
fi

# Description
echo ""
read -p "Description du service facturé: " DESCRIPTION

# Script SQL
cat > /tmp/add_invoice.sql << EOF
INSERT INTO invoices (
    id,
    invoice_number,
    client_name,
    client_email,
    billing_address,
    issue_date,
    due_date,
    subtotal_ht,
    vat_rate,
    vat_amount,
    total_ttc,
    status,
    owner_user_id,
    created_at
) VALUES (
    gen_random_uuid(),
    '$INVOICE_NUM',
    '$CLIENT_NAME',
    '$CLIENT_EMAIL',
    '$ADDRESS',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    $AMOUNT_HT,
    $VAT_RATE,
    $VAT_AMOUNT,
    $TOTAL_TTC,
    '$STATUS',
    gen_random_uuid(),
    CURRENT_TIMESTAMP
);

INSERT INTO invoice_items (
    id,
    invoice_id,
    description,
    quantity,
    unit_price,
    tax_rate,
    line_total_ht
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM invoices WHERE invoice_number = '$INVOICE_NUM'),
    '$DESCRIPTION',
    1.000,
    $AMOUNT_HT,
    $VAT_RATE,
    $AMOUNT_HT
);

SELECT '✅ Facture ajoutée avec succès' AS message;
EOF

# Exécution
echo ""
echo "⏳ Ajout en cours..."
echo ""
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < /tmp/add_invoice.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Facture ajoutée avec succès !"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📄 Numéro:      $INVOICE_NUM"
    echo "👤 Client:      $CLIENT_NAME"
    echo "💰 Total TTC:   $TOTAL_TTC TND"
    echo "📌 Statut:      $STATUS"
    echo ""

    echo "📊 Statistiques des factures:"
    docker exec -t "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" << 'EOSQL'
SELECT 
    status,
    COUNT(*) AS nombre,
    SUM(total_ttc)::numeric(10,2) AS montant_total
FROM invoices
GROUP BY status
ORDER BY status;
EOSQL
else
    echo "❌ Erreur lors de l'ajout de la facture"
fi

# Nettoyage
rm -f /tmp/add_invoice.sql

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Script terminé"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
