package com.plateforme.electronique.subscription.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class SubscriptionResponse {
    private UUID id;
    private UUID userId;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean autoRenew;

    private UUID planId;
    private String planName;
    private String planDescription;
    private BigDecimal priceMonthly;
    private BigDecimal priceAnnual;
}
