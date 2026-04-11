package com.plateforme.electronique.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TotpEnableRequest {
    @NotBlank
    private String code;
}
