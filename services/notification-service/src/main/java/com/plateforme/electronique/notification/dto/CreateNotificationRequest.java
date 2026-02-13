package com.plateforme.electronique.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateNotificationRequest {

    @NotNull
    private UUID userId;

    private String type = "INFO";

    @NotBlank
    private String title;

    private String message;
}
