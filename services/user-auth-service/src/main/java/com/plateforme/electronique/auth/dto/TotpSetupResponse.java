package com.plateforme.electronique.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class TotpSetupResponse {
    private String secret;
    private String otpAuthUri;
    private String qrCodeDataUri;
}
