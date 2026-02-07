package com.plateforme.electronique.notification.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
@Slf4j
public class NotificationExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntime(RuntimeException ex) {
        log.warn("Notification error: {}", ex.getMessage());
        String message = ex.getMessage();
        if (message == null) message = "Erreur interne";
        if (message.contains("Authentication failed") || message.contains("535") || message.contains("Username and Password not accepted")) {
            message = "E-mail non envoyé : authentification Gmail refusée. Utilisez un mot de passe d'application (Google Compte > Sécurité > Mots de passe des applications) et configurez MAIL_PASSWORD.";
        } else if (message.contains("Could not connect to SMTP host") || message.contains("Connection refused")) {
            message = "E-mail non envoyé : impossible de joindre le serveur SMTP. Vérifiez le réseau et les paramètres MAIL_HOST/MAIL_PORT.";
        } else if (message.contains("Impossible d'envoyer")) {
            // keep the existing French message
        } else {
            message = "Impossible d'envoyer l'email de test : " + message;
        }
        return ResponseEntity
                .status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("message", message));
    }
}
