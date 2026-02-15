package com.plateforme.electronique.invoice.service;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.plateforme.electronique.invoice.entity.Invoice;
import com.plateforme.electronique.invoice.entity.InvoiceItem;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class InvoicePdfService {

    private static final DeviceRgb PRIMARY = new DeviceRgb(30, 41, 59);
    private static final DeviceRgb HEADER_BG = new DeviceRgb(241, 245, 249);
    private static final DeviceRgb LIGHT_BORDER = new DeviceRgb(226, 232, 240);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final Locale FR = Locale.FRANCE;

    public byte[] generate(Invoice invoice) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(out);
        PdfDocument pdf = new PdfDocument(writer);
        Document doc = new Document(pdf, PageSize.A4);
        doc.setMargins(40, 40, 40, 40);

        addHeader(doc, invoice);
        addClientSection(doc, invoice);
        addItemsTable(doc, invoice);
        addTotals(doc, invoice);
        addFooter(doc, invoice);

        doc.close();
        return out.toByteArray();
    }

    private void addHeader(Document doc, Invoice invoice) {
        Table header = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                .useAllAvailableWidth();

        // Left side: title
        Cell left = new Cell().setBorder(Border.NO_BORDER);
        left.add(new Paragraph("FACTURE")
                .setFontSize(24).setBold().setFontColor(PRIMARY));
        if (invoice.getInvoiceNumber() != null) {
            left.add(new Paragraph(invoice.getInvoiceNumber())
                    .setFontSize(12).setFontColor(new DeviceRgb(100, 116, 139)));
        }
        header.addCell(left);

        // Right side: status and dates
        Cell right = new Cell().setBorder(Border.NO_BORDER)
                .setTextAlignment(TextAlignment.RIGHT);
        right.add(new Paragraph("Statut: " + formatStatus(invoice.getStatus()))
                .setFontSize(10).setBold());
        if (invoice.getIssueDate() != null) {
            right.add(new Paragraph("Date d'emission: " + invoice.getIssueDate().format(DATE_FMT))
                    .setFontSize(10));
        }
        if (invoice.getDueDate() != null) {
            right.add(new Paragraph("Date d'echeance: " + invoice.getDueDate().format(DATE_FMT))
                    .setFontSize(10));
        }
        header.addCell(right);

        doc.add(header);
        doc.add(new Paragraph("\n"));
    }

    private void addClientSection(Document doc, Invoice invoice) {
        doc.add(new Paragraph("FACTURE A")
                .setFontSize(10).setBold().setFontColor(new DeviceRgb(100, 116, 139)));

        Table clientTable = new Table(UnitValue.createPercentArray(new float[]{1}))
                .useAllAvailableWidth()
                .setBorder(new SolidBorder(LIGHT_BORDER, 1))
                .setBackgroundColor(HEADER_BG);

        Cell clientCell = new Cell().setBorder(Border.NO_BORDER).setPadding(12);

        if (invoice.getClientName() != null) {
            clientCell.add(new Paragraph(invoice.getClientName())
                    .setFontSize(13).setBold().setFontColor(PRIMARY));
        }
        if (invoice.getClientEmail() != null) {
            clientCell.add(new Paragraph(invoice.getClientEmail())
                    .setFontSize(10).setFontColor(new DeviceRgb(100, 116, 139)));
        }
        if (invoice.getBillingAddress() != null && !invoice.getBillingAddress().isBlank()) {
            clientCell.add(new Paragraph(invoice.getBillingAddress())
                    .setFontSize(10).setFontColor(new DeviceRgb(71, 85, 105)));
        }

        clientTable.addCell(clientCell);
        doc.add(clientTable);
        doc.add(new Paragraph("\n"));
    }

    private void addItemsTable(Document doc, Invoice invoice) {
        if (invoice.getItems() == null || invoice.getItems().isEmpty()) return;

        doc.add(new Paragraph("DETAILS")
                .setFontSize(10).setBold().setFontColor(new DeviceRgb(100, 116, 139)));

        Table table = new Table(UnitValue.createPercentArray(new float[]{4, 1, 1.5f, 1, 1.5f}))
                .useAllAvailableWidth();

        // Header row
        String[] headers = {"Description", "Quantite", "Prix unitaire", "TVA", "Total HT"};
        for (String h : headers) {
            table.addHeaderCell(new Cell()
                    .setBackgroundColor(PRIMARY)
                    .setPadding(8)
                    .add(new Paragraph(h)
                            .setFontSize(9).setBold()
                            .setFontColor(ColorConstants.WHITE)));
        }

        // Data rows
        boolean alt = false;
        for (InvoiceItem item : invoice.getItems()) {
            DeviceRgb bg = alt ? HEADER_BG : new DeviceRgb(255, 255, 255);
            alt = !alt;

            table.addCell(createDataCell(item.getDescription(), bg));
            table.addCell(createDataCell(formatDecimal(item.getQuantity()), bg));
            table.addCell(createDataCell(formatCurrency(item.getUnitPrice()), bg));
            table.addCell(createDataCell(
                    item.getTaxRate() != null ? item.getTaxRate() + "%" : "-", bg));
            table.addCell(createDataCell(formatCurrency(item.getLineTotalHt()), bg));
        }

        doc.add(table);
        doc.add(new Paragraph("\n"));
    }

    private void addTotals(Document doc, Invoice invoice) {
        Table totals = new Table(UnitValue.createPercentArray(new float[]{3, 1}))
                .useAllAvailableWidth();

        // Empty left cell
        totals.addCell(new Cell().setBorder(Border.NO_BORDER));

        // Totals right
        Cell right = new Cell().setBorder(new SolidBorder(LIGHT_BORDER, 1)).setPadding(12);

        right.add(createTotalLine("Sous-total HT", formatCurrency(invoice.getSubtotalHt())));
        right.add(createTotalLine("TVA (" + (invoice.getVatRate() != null ? invoice.getVatRate() + "%" : "19%") + ")",
                formatCurrency(invoice.getVatAmount())));

        Paragraph totalLine = new Paragraph()
                .setFontSize(13).setBold().setFontColor(PRIMARY)
                .setMarginTop(8).setPaddingTop(8)
                .setBorderTop(new SolidBorder(LIGHT_BORDER, 1));
        totalLine.add("Total TTC:  " + formatCurrency(invoice.getTotalTtc()));
        right.add(totalLine);

        totals.addCell(right);
        doc.add(totals);
    }

    private void addFooter(Document doc, Invoice invoice) {
        doc.add(new Paragraph("\n\n"));
        doc.add(new Paragraph("Merci pour votre confiance.")
                .setFontSize(9).setFontColor(new DeviceRgb(148, 163, 184))
                .setTextAlignment(TextAlignment.CENTER));
    }

    private Cell createDataCell(String text, DeviceRgb bg) {
        return new Cell()
                .setBackgroundColor(bg)
                .setPadding(8)
                .setBorderBottom(new SolidBorder(LIGHT_BORDER, 0.5f))
                .setBorderLeft(Border.NO_BORDER)
                .setBorderRight(Border.NO_BORDER)
                .setBorderTop(Border.NO_BORDER)
                .add(new Paragraph(text != null ? text : "-").setFontSize(9));
    }

    private Paragraph createTotalLine(String label, String value) {
        return new Paragraph()
                .setFontSize(10)
                .add(label + ":  ")
                .add(value);
    }

    private String formatCurrency(BigDecimal value) {
        if (value == null) return "0,00 TND";
        NumberFormat nf = NumberFormat.getNumberInstance(FR);
        nf.setMinimumFractionDigits(2);
        nf.setMaximumFractionDigits(2);
        return nf.format(value) + " TND";
    }

    private String formatDecimal(BigDecimal value) {
        if (value == null) return "0";
        return value.stripTrailingZeros().toPlainString();
    }

    private String formatStatus(Invoice.Status status) {
        return switch (status) {
            case DRAFT -> "Brouillon";
            case VALIDATED -> "Validee";
            case SENT -> "Envoyee";
            case PAID -> "Payee";
            case CANCELLED -> "Annulee";
        };
    }
}
