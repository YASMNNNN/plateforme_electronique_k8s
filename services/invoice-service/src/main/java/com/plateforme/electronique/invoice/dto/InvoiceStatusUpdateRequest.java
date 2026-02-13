package com.plateforme.electronique.invoice.dto;

import com.plateforme.electronique.invoice.entity.Invoice;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InvoiceStatusUpdateRequest {

    @NotNull
    private Invoice.Status status;
}
