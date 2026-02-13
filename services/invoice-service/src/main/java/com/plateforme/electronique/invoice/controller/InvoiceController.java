package com.plateforme.electronique.invoice.controller;

import com.plateforme.electronique.invoice.dto.CreateInvoiceRequest;
import com.plateforme.electronique.invoice.dto.InvoiceStatusUpdateRequest;
import com.plateforme.electronique.invoice.dto.MerchantInvoiceStatsResponse;
import com.plateforme.electronique.invoice.entity.Invoice;
import com.plateforme.electronique.invoice.repository.InvoiceRepository;
import com.plateforme.electronique.invoice.service.InvoiceService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final InvoiceRepository invoiceRepository;

    public InvoiceController(InvoiceService invoiceService, InvoiceRepository invoiceRepository) {
        this.invoiceService = invoiceService;
        this.invoiceRepository = invoiceRepository;
    }

    @PostMapping
    public ResponseEntity<Invoice> create(@Valid @RequestBody CreateInvoiceRequest request) {
        return ResponseEntity.ok(invoiceService.createInvoice(request));
    }

    @GetMapping
    public ResponseEntity<Page<Invoice>> list(
            @RequestParam(required = false) UUID ownerUserId,
            @RequestParam(required = false) Invoice.Status status,
            Pageable pageable) {
        if (ownerUserId != null && status != null) {
            return ResponseEntity.ok(invoiceRepository.findByOwnerUserIdAndStatus(ownerUserId, status, pageable));
        }
        if (ownerUserId != null) {
            return ResponseEntity.ok(invoiceRepository.findByOwnerUserId(ownerUserId, pageable));
        }
        if (status != null) {
            return ResponseEntity.ok(invoiceRepository.findByStatus(status, pageable));
        }
        return ResponseEntity.ok(invoiceRepository.findAll(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Invoice> detail(@PathVariable UUID id,
                                          @RequestParam(required = false) UUID ownerUserId) {
        if (ownerUserId != null) {
            return ResponseEntity.of(invoiceRepository.findByIdAndOwnerUserId(id, ownerUserId));
        }
        return ResponseEntity.of(invoiceRepository.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Invoice> update(@PathVariable UUID id,
                                          @RequestParam UUID ownerUserId,
                                          @Valid @RequestBody CreateInvoiceRequest request) {
        return ResponseEntity.ok(invoiceService.updateDraft(id, ownerUserId, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @RequestParam UUID ownerUserId) {
        invoiceService.deleteDraft(id, ownerUserId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/validate")
    public ResponseEntity<Invoice> validate(@PathVariable UUID id, @RequestParam UUID ownerUserId) {
        return ResponseEntity.ok(invoiceService.validateInvoice(id, ownerUserId));
    }

    @PostMapping("/{id}/send")
    public ResponseEntity<Invoice> send(@PathVariable UUID id, @RequestParam UUID ownerUserId) {
        return ResponseEntity.ok(invoiceService.sendInvoice(id, ownerUserId));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Invoice> cancel(@PathVariable UUID id, @RequestParam UUID ownerUserId) {
        return ResponseEntity.ok(invoiceService.cancelInvoice(id, ownerUserId));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Invoice> updateStatus(@PathVariable UUID id,
                                                @Valid @RequestBody InvoiceStatusUpdateRequest request) {
        return ResponseEntity.ok(invoiceService.updateStatus(id, request.getStatus()));
    }

    @GetMapping("/stats/{ownerUserId}")
    public ResponseEntity<MerchantInvoiceStatsResponse> stats(@PathVariable UUID ownerUserId) {
        return ResponseEntity.ok(invoiceService.getStatsByOwner(ownerUserId));
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> pdf(@PathVariable UUID id, @RequestParam UUID ownerUserId) {
        Invoice invoice = invoiceRepository.findByIdAndOwnerUserId(id, ownerUserId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));
        String content = "PDF placeholder for invoice " + invoice.getInvoiceNumber();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=invoice.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(content.getBytes(StandardCharsets.UTF_8));
    }
}
