package com.plateforme.electronique.invoice.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class MerchantInvoiceStatsResponse {
    private UUID ownerUserId;
    private long totalInvoices;
    private long paidInvoices;
    private long draftInvoices;
    private long sentInvoices;
    private BigDecimal totalRevenue;
}
