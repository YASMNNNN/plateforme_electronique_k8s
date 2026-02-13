package com.plateforme.electronique.auth.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {

    @Email
    @NotBlank
    private String email;

    @NotBlank
    @Size(min = 8)
    private String password;

    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    private String phone;
    private String companyName;
    private String taxId;

    @Pattern(regexp = "ADMIN|USER|ACCOUNTANT|MERCHANT")
    private String role = "USER";
}
