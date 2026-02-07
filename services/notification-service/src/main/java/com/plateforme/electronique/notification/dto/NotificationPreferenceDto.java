package com.plateforme.electronique.notification.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreferenceDto {
    private String email;
    private boolean emailEnabled;
    private boolean paymentAlertsEnabled;
    private boolean invoiceAlertsEnabled;
}
