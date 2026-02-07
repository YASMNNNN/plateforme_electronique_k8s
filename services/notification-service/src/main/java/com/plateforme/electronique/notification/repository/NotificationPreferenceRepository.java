package com.plateforme.electronique.notification.repository;

import com.plateforme.electronique.notification.entity.NotificationPreference;

import java.util.Optional;

public interface NotificationPreferenceRepository extends org.springframework.data.jpa.repository.JpaRepository<NotificationPreference, Long> {

    Optional<NotificationPreference> findByConfigKey(String configKey);
}
