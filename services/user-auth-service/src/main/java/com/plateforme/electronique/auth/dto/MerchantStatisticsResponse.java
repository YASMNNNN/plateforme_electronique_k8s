package com.plateforme.electronique.auth.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class MerchantStatisticsResponse {
    private UUID merchantId;
    private String companyName;
    private String role;
    private boolean active;
}
