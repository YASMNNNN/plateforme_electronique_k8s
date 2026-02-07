package com.plateforme.electronique.notification.controller;

import com.plateforme.electronique.notification.dto.NotificationPreferenceDto;
import com.plateforme.electronique.notification.service.NotificationPreferenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin
public class NotificationController {

    private final NotificationPreferenceService preferenceService;

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
}
