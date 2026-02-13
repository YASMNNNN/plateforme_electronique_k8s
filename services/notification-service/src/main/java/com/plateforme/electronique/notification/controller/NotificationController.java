package com.plateforme.electronique.notification.controller;

import com.plateforme.electronique.notification.dto.CreateNotificationRequest;
import com.plateforme.electronique.notification.dto.NotificationDto;
import com.plateforme.electronique.notification.dto.NotificationPreferenceDto;
import com.plateforme.electronique.notification.service.NotificationPreferenceService;
import com.plateforme.electronique.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin
public class NotificationController {

    private final NotificationPreferenceService preferenceService;
    private final NotificationService notificationService;

    @GetMapping("/preferences")
    public ResponseEntity<NotificationPreferenceDto> getPreferences() {
        return ResponseEntity.ok(preferenceService.getPreferences());
    }

    @PutMapping("/preferences")
    public ResponseEntity<NotificationPreferenceDto> updatePreferences(
            @Valid @RequestBody NotificationPreferenceDto dto) {
        return ResponseEntity.ok(preferenceService.updatePreferences(dto));
    }

    @PostMapping("/test-email")
    public ResponseEntity<Void> sendTestEmail(@RequestParam String to) {
        preferenceService.sendTestEmail(to);
        return ResponseEntity.ok().build();
    }

    @PostMapping
    public ResponseEntity<NotificationDto> create(@Valid @RequestBody CreateNotificationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(notificationService.create(request));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<NotificationDto>> getByUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(notificationService.getByUser(userId));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationDto> markAsRead(@PathVariable UUID id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        notificationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
