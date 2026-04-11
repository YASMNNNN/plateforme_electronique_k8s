package com.plateforme.electronique.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TotpDisableRequest {
    @NotBlank
    private String password;
    private String code;
}
