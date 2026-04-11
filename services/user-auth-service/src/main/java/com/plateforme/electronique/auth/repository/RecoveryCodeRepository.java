package com.plateforme.electronique.auth.repository;

import com.plateforme.electronique.auth.entity.RecoveryCode;
import com.plateforme.electronique.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface RecoveryCodeRepository extends JpaRepository<RecoveryCode, UUID> {

    List<RecoveryCode> findByUserAndUsedFalse(User user);

    @Modifying
    @Query("DELETE FROM RecoveryCode rc WHERE rc.user = :user")
    void deleteAllByUser(@Param("user") User user);
}
