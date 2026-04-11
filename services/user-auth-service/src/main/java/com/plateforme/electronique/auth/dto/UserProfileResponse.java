package com.plateforme.electronique.auth.dto;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class UserProfileResponse {
    private UUID id;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private String companyName;
    private String taxId;
    private String role;
    private boolean active;
    private boolean totpEnabled;
}
