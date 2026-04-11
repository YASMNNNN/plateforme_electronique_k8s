package com.plateforme.electronique.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private Long expiresInSeconds;

    /** When true, the client must complete the /2fa/verify step using mfaToken. */
    private Boolean mfaRequired;
    private String mfaToken;
    private Long mfaExpiresInSeconds;
}
