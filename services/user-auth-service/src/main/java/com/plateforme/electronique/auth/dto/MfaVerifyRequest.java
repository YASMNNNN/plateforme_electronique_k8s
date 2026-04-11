package com.plateforme.electronique.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MfaVerifyRequest {
    @NotBlank
    private String mfaToken;

    @NotBlank
    private String code;
}
