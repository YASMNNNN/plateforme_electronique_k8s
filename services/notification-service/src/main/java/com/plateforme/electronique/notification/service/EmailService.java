package com.plateforme.electronique.notification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendSimpleEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            log.info("Email envoyé à {}", to);
        } catch (Exception e) {
            log.error("Erreur envoi email à {}: {}", to, e.getMessage());
            throw new RuntimeException("Impossible d'envoyer l'email: " + (e.getCause() != null ? e.getCause().getMessage() : e.getMessage()));
        }
    }
}
