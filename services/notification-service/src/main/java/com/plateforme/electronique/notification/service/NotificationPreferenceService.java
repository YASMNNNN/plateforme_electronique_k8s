package com.plateforme.electronique.notification.service;

import com.plateforme.electronique.notification.dto.NotificationPreferenceDto;
import com.plateforme.electronique.notification.entity.NotificationPreference;
import com.plateforme.electronique.notification.repository.NotificationPreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationPreferenceService {

    private static final String DEFAULT_KEY = "default";

    private final NotificationPreferenceRepository repository;
    private final EmailService emailService;

    public NotificationPreferenceDto getPreferences() {
        return repository.findByConfigKey(DEFAULT_KEY)
                .map(this::toDto)
                .orElseGet(this::defaultDto);
    }

    @Transactional
    public NotificationPreferenceDto updatePreferences(NotificationPreferenceDto dto) {
        NotificationPreference pref = repository.findByConfigKey(DEFAULT_KEY)
                .orElseGet(() -> {
                    NotificationPreference p = new NotificationPreference();
                    p.setConfigKey(DEFAULT_KEY);
                    return p;
                });
        pref.setEmail(dto.getEmail() != null ? dto.getEmail() : pref.getEmail());
        pref.setEmailEnabled(dto.isEmailEnabled());
        pref.setPaymentAlertsEnabled(dto.isPaymentAlertsEnabled());
        pref.setInvoiceAlertsEnabled(dto.isInvoiceAlertsEnabled());
        if (pref.getEmail() == null || pref.getEmail().isBlank()) {
            pref.setEmail("yasminegr432@gmail.com");
        }
        return toDto(repository.save(pref));
    }

    public void sendTestEmail(String to) {
        emailService.sendSimpleEmail(
                to,
                "Plateforme Électronique - Test de notification",
                "Ceci est un email de test. Les notifications par mail sont bien configurées."
        );
    }

    private NotificationPreferenceDto toDto(NotificationPreference p) {
        return NotificationPreferenceDto.builder()
                .email(p.getEmail())
                .emailEnabled(p.isEmailEnabled())
                .paymentAlertsEnabled(p.isPaymentAlertsEnabled())
                .invoiceAlertsEnabled(p.isInvoiceAlertsEnabled())
                .build();
    }

    private NotificationPreferenceDto defaultDto() {
        return NotificationPreferenceDto.builder()
                .email("yasminegr432@gmail.com")
                .emailEnabled(true)
                .paymentAlertsEnabled(true)
                .invoiceAlertsEnabled(true)
                .build();
    }
}
