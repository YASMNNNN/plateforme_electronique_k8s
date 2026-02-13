package com.plateforme.electronique.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class CardRequest {

    @NotNull
    private UUID userId;

    @NotBlank
    private String cardHolderName;

    @NotBlank
    @Size(min = 4, max = 4)
    private String lastFourDigits;

    private String cardBrand;
    private Integer expiryMonth;
    private Integer expiryYear;
    private boolean isDefault;
    private String tokenReference;
}
