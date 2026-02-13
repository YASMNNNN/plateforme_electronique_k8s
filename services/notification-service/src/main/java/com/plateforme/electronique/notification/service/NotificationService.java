package com.plateforme.electronique.notification.service;

import com.plateforme.electronique.notification.dto.CreateNotificationRequest;
import com.plateforme.electronique.notification.dto.NotificationDto;
import com.plateforme.electronique.notification.entity.Notification;
import com.plateforme.electronique.notification.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public NotificationDto create(CreateNotificationRequest request) {
        Notification notification = Notification.builder()
                .userId(request.getUserId())
                .type(Notification.Type.valueOf(request.getType().toUpperCase()))
                .title(request.getTitle())
                .message(request.getMessage())
                .build();
        return toDto(notificationRepository.save(notification));
    }

    public List<NotificationDto> getByUser(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toDto).toList();
    }

    public NotificationDto markAsRead(UUID id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        notification.setRead(true);
        return toDto(notificationRepository.save(notification));
    }

    public void delete(UUID id) {
        if (!notificationRepository.existsById(id)) {
            throw new IllegalArgumentException("Notification not found");
        }
        notificationRepository.deleteById(id);
    }

    private NotificationDto toDto(Notification n) {
        return NotificationDto.builder()
                .id(n.getId())
                .userId(n.getUserId())
                .type(n.getType().name())
                .title(n.getTitle())
                .message(n.getMessage())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
