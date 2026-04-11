package com.plateforme.electronique.auth.service;

import com.plateforme.electronique.auth.dto.RecoveryCodesResponse;
import com.plateforme.electronique.auth.dto.TotpSetupResponse;
import com.plateforme.electronique.auth.entity.RecoveryCode;
import com.plateforme.electronique.auth.entity.User;
import com.plateforme.electronique.auth.repository.RecoveryCodeRepository;
import com.plateforme.electronique.auth.repository.UserRepository;
import com.plateforme.electronique.auth.security.SecretCipher;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class MfaService {

    private static final int RECOVERY_CODE_COUNT = 10;

    private final UserRepository userRepository;
    private final RecoveryCodeRepository recoveryCodeRepository;
    private final TotpService totpService;
    private final SecretCipher secretCipher;
    private final PasswordEncoder passwordEncoder;

    public MfaService(UserRepository userRepository,
                      RecoveryCodeRepository recoveryCodeRepository,
                      TotpService totpService,
                      SecretCipher secretCipher,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.recoveryCodeRepository = recoveryCodeRepository;
        this.totpService = totpService;
        this.secretCipher = secretCipher;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public TotpSetupResponse beginSetup(User user) {
        if (user.isTotpEnabled()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "2FA already enabled");
        }
        String secret = totpService.newSecret();
        user.setTotpSecretPendingEncrypted(secretCipher.encrypt(secret));
        userRepository.save(user);
        return TotpSetupResponse.builder()
                .secret(secret)
                .otpAuthUri(totpService.buildOtpAuthUri(secret, user.getEmail()))
                .qrCodeDataUri(totpService.buildQrDataUri(secret, user.getEmail()))
                .build();
    }

    @Transactional
    public RecoveryCodesResponse enable(User user, String code) {
        if (user.isTotpEnabled()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "2FA already enabled");
        }
        String pending = user.getTotpSecretPendingEncrypted();
        if (pending == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start setup first");
        }
        String secret = secretCipher.decrypt(pending);
        if (!totpService.verifyCode(secret, code)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid verification code");
        }
        user.setTotpSecretEncrypted(pending);
        user.setTotpSecretPendingEncrypted(null);
        user.setTotpEnabled(true);
        user.setMfaEnrolledAt(LocalDateTime.now());
        userRepository.save(user);
        List<String> plainCodes = regenerateRecoveryCodes(user);
        return new RecoveryCodesResponse(plainCodes);
    }

    @Transactional
    public void disable(User user, String password, String code) {
        if (!user.isTotpEnabled()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "2FA not enabled");
        }
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid password");
        }
        if (code == null || code.isBlank() || !verifyLoginCode(user, code)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid verification code");
        }
        user.setTotpEnabled(false);
        user.setTotpSecretEncrypted(null);
        user.setTotpSecretPendingEncrypted(null);
        user.setMfaEnrolledAt(null);
        userRepository.save(user);
        recoveryCodeRepository.deleteAllByUser(user);
    }

    @Transactional
    public RecoveryCodesResponse regenerateRecoveryCodesForUser(User user, String code) {
        if (!user.isTotpEnabled()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "2FA not enabled");
        }
        if (!verifyLoginCode(user, code)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid verification code");
        }
        return new RecoveryCodesResponse(regenerateRecoveryCodes(user));
    }

    /**
     * Used during the login flow. Accepts either a 6-digit TOTP code or a recovery code.
     * Recovery codes are consumed on success.
     */
    @Transactional
    public boolean verifyLoginCode(User user, String rawCode) {
        if (rawCode == null) return false;
        String trimmed = rawCode.trim();
        if (trimmed.isEmpty()) return false;

        if (trimmed.length() == 6 && trimmed.chars().allMatch(Character::isDigit)) {
            String secret = secretCipher.decrypt(user.getTotpSecretEncrypted());
            return totpService.verifyCode(secret, trimmed);
        }
        return consumeRecoveryCode(user, trimmed);
    }

    private boolean consumeRecoveryCode(User user, String candidate) {
        String normalized = candidate.replace("-", "").toUpperCase();
        List<RecoveryCode> codes = recoveryCodeRepository.findByUserAndUsedFalse(user);
        for (RecoveryCode rc : codes) {
            if (passwordEncoder.matches(normalized, rc.getCodeHash())) {
                rc.setUsed(true);
                rc.setUsedAt(LocalDateTime.now());
                recoveryCodeRepository.save(rc);
                return true;
            }
        }
        return false;
    }

    private List<String> regenerateRecoveryCodes(User user) {
        recoveryCodeRepository.deleteAllByUser(user);
        List<String> plain = new ArrayList<>(RECOVERY_CODE_COUNT);
        for (int i = 0; i < RECOVERY_CODE_COUNT; i++) {
            String display = totpService.generateRecoveryCode();
            String normalized = display.replace("-", "").toUpperCase();
            recoveryCodeRepository.save(RecoveryCode.builder()
                    .user(user)
                    .codeHash(passwordEncoder.encode(normalized))
                    .used(false)
                    .build());
            plain.add(display);
        }
        return plain;
    }
}
