package com.plateforme.electronique.notification.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notification_preference")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "config_key", unique = true, nullable = false)
    private String configKey = "default";

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "email_enabled", nullable = false)
    private boolean emailEnabled = true;

    @Column(name = "payment_alerts_enabled", nullable = false)
    private boolean paymentAlertsEnabled = true;

    @Column(name = "invoice_alerts_enabled", nullable = false)
    private boolean invoiceAlertsEnabled = true;
}
