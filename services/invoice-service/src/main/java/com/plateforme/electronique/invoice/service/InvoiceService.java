package com.plateforme.electronique.invoice.service;

import com.plateforme.electronique.invoice.dto.CreateInvoiceRequest;
import com.plateforme.electronique.invoice.dto.MerchantInvoiceStatsResponse;
import com.plateforme.electronique.invoice.entity.Invoice;
import com.plateforme.electronique.invoice.entity.InvoiceItem;
import com.plateforme.electronique.invoice.repository.InvoiceRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;

    public InvoiceService(InvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }

    public Invoice createInvoice(CreateInvoiceRequest request) {
        Invoice invoice = Invoice.builder()
                .ownerUserId(request.getOwnerUserId())
                .clientName(request.getClientName())
                .clientEmail(request.getClientEmail())
                .billingAddress(request.getBillingAddress())
                .vatRate(defaultVat(request.getVatRate()))
                .issueDate(defaultDate(request.getIssueDate()))
                .dueDate(request.getDueDate())
                .status(Invoice.Status.DRAFT)
                .build();

        List<InvoiceItem> items = request.getItems().stream()
                .map(item -> InvoiceItem.builder()
                        .invoice(invoice)
                        .description(item.getDescription())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .taxRate(defaultVat(item.getTaxRate()))
                        .lineTotalHt(item.getUnitPrice().multiply(item.getQuantity()))
                        .build())
                .toList();
        invoice.setItems(items);
        computeTotals(invoice);
        return invoiceRepository.save(invoice);
    }

    public Invoice updateDraft(UUID invoiceId, UUID ownerId, CreateInvoiceRequest request) {
        Invoice invoice = invoiceRepository.findByIdAndOwnerUserId(invoiceId, ownerId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));
        if (invoice.getStatus() != Invoice.Status.DRAFT) {
            throw new IllegalStateException("Only drafts can be modified");
        }
        invoice.setClientName(request.getClientName());
        invoice.setClientEmail(request.getClientEmail());
        invoice.setBillingAddress(request.getBillingAddress());
        invoice.setVatRate(defaultVat(request.getVatRate()));
        invoice.setIssueDate(defaultDate(request.getIssueDate()));
        invoice.setDueDate(request.getDueDate());
        invoice.getItems().clear();
        List<InvoiceItem> items = request.getItems().stream()
                .map(item -> InvoiceItem.builder()
                        .invoice(invoice)
                        .description(item.getDescription())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .taxRate(defaultVat(item.getTaxRate()))
                        .lineTotalHt(item.getUnitPrice().multiply(item.getQuantity()))
                        .build())
                .toList();
        invoice.getItems().addAll(items);
        invoice.setUpdatedAt(LocalDateTime.now());
        computeTotals(invoice);
        return invoiceRepository.save(invoice);
    }

    public Invoice validateInvoice(UUID invoiceId, UUID ownerId) {
        Invoice invoice = invoiceRepository.findByIdAndOwnerUserId(invoiceId, ownerId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));
        if (invoice.getStatus() != Invoice.Status.DRAFT) {
            throw new IllegalStateException("Only drafts can be validated");
        }
        invoice.setInvoiceNumber(generateInvoiceNumber());
        invoice.setStatus(Invoice.Status.VALIDATED);
        invoice.setUpdatedAt(LocalDateTime.now());
        return invoiceRepository.save(invoice);
    }

    public Invoice sendInvoice(UUID invoiceId, UUID ownerId) {
        Invoice invoice = invoiceRepository.findByIdAndOwnerUserId(invoiceId, ownerId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));
        if (invoice.getStatus() == Invoice.Status.DRAFT) {
            throw new IllegalStateException("Invoice must be validated before send");
        }
        invoice.setStatus(Invoice.Status.SENT);
        invoice.setUpdatedAt(LocalDateTime.now());
        return invoiceRepository.save(invoice);
    }

    public Invoice cancelInvoice(UUID invoiceId, UUID ownerId) {
        Invoice invoice = invoiceRepository.findByIdAndOwnerUserId(invoiceId, ownerId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));
        invoice.setStatus(Invoice.Status.CANCELLED);
        invoice.setUpdatedAt(LocalDateTime.now());
        return invoiceRepository.save(invoice);
    }

    public void deleteDraft(UUID invoiceId, UUID ownerId) {
        Invoice invoice = invoiceRepository.findByIdAndOwnerUserId(invoiceId, ownerId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));
        if (invoice.getStatus() != Invoice.Status.DRAFT && invoice.getStatus() != Invoice.Status.CANCELLED) {
            throw new IllegalStateException("Only drafts and cancelled invoices can be deleted");
        }
        invoiceRepository.delete(invoice);
    }

    public Invoice updateStatus(UUID invoiceId, Invoice.Status newStatus) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));
        if (newStatus == Invoice.Status.VALIDATED && invoice.getInvoiceNumber() == null) {
            invoice.setInvoiceNumber(generateInvoiceNumber());
        }
        invoice.setStatus(newStatus);
        invoice.setUpdatedAt(LocalDateTime.now());
        return invoiceRepository.save(invoice);
    }

    public MerchantInvoiceStatsResponse getStatsByOwner(UUID ownerUserId) {
        return MerchantInvoiceStatsResponse.builder()
                .ownerUserId(ownerUserId)
                .totalInvoices(invoiceRepository.countByOwnerUserId(ownerUserId))
                .paidInvoices(invoiceRepository.countByOwnerUserIdAndStatus(ownerUserId, Invoice.Status.PAID))
                .draftInvoices(invoiceRepository.countByOwnerUserIdAndStatus(ownerUserId, Invoice.Status.DRAFT))
                .sentInvoices(invoiceRepository.countByOwnerUserIdAndStatus(ownerUserId, Invoice.Status.SENT))
                .totalRevenue(invoiceRepository.sumPaidTotalByOwner(ownerUserId))
                .build();
    }

    private void computeTotals(Invoice invoice) {
        BigDecimal subtotal = invoice.getItems().stream()
                .map(InvoiceItem::computeLineTotalHt)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal vatRate = defaultVat(invoice.getVatRate());
        BigDecimal vatAmount = subtotal.multiply(vatRate).divide(BigDecimal.valueOf(100), 4, java.math.RoundingMode.HALF_UP);
        invoice.setSubtotalHt(subtotal);
        invoice.setVatAmount(vatAmount);
        invoice.setTotalTtc(subtotal.add(vatAmount));
    }

    private BigDecimal defaultVat(BigDecimal rate) {
        return rate == null ? BigDecimal.valueOf(19) : rate;
    }

    private LocalDate defaultDate(LocalDate date) {
        return date == null ? LocalDate.now() : date;
    }

    private String generateInvoiceNumber() {
        int year = LocalDate.now().getYear();
        long seq = invoiceRepository.count() + 1;
        return String.format("FAC-%d-%05d", year, seq);
    }
}
