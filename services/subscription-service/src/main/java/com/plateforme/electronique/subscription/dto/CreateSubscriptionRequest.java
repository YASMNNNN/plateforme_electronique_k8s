package com.plateforme.electronique.subscription.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateSubscriptionRequest {

    @NotNull
    private UUID userId;

    @NotBlank
    private String planName;

    private boolean autoRenew = true;
}
