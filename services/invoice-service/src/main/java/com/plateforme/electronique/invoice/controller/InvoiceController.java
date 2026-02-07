package com.plateforme.electronique.invoice.controller;

import com.plateforme.electronique.invoice.dto.CreateInvoiceRequest;
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
    public ResponseEntity<Page<Invoice>> list(@RequestParam(required = false) UUID ownerUserId, Pageable pageable) {
        if (ownerUserId != null) {
            return ResponseEntity.ok(invoiceRepository.findByOwnerUserId(ownerUserId, pageable));
        }
        return ResponseEntity.ok(invoiceRepository.findAll(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Invoice> detail(@PathVariable UUID id, @RequestParam UUID ownerUserId) {
        return ResponseEntity.of(invoiceRepository.findByIdAndOwnerUserId(id, ownerUserId));
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
