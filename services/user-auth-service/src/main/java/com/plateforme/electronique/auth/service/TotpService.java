package com.plateforme.electronique.auth.service;

import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import dev.samstevens.totp.util.Utils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;

@Service
public class TotpService {

    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int RECOVERY_CODE_LENGTH = 10;

    private final SecretGenerator secretGenerator = new DefaultSecretGenerator();
    private final QrGenerator qrGenerator = new ZxingPngQrGenerator();
    private final CodeVerifier verifier;
    private final SecureRandom random = new SecureRandom();
    private final String issuer;

    public TotpService(@Value("${security.mfa.issuer:Plateforme Electronique}") String issuer) {
        this.issuer = issuer;
        TimeProvider time = new SystemTimeProvider();
        CodeGenerator codeGen = new DefaultCodeGenerator(HashingAlgorithm.SHA1, 6);
        DefaultCodeVerifier v = new DefaultCodeVerifier(codeGen, time);
        v.setAllowedTimePeriodDiscrepancy(1);
        this.verifier = v;
    }

    public String newSecret() {
        return secretGenerator.generate();
    }

    public String buildOtpAuthUri(String secret, String userEmail) {
        return new QrData.Builder()
                .label(userEmail)
                .secret(secret)
                .issuer(issuer)
                .algorithm(HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build()
                .getUri();
    }

    public String buildQrDataUri(String secret, String userEmail) {
        QrData data = new QrData.Builder()
                .label(userEmail)
                .secret(secret)
                .issuer(issuer)
                .algorithm(HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build();
        try {
            return Utils.getDataUriForImage(
                    qrGenerator.generate(data),
                    qrGenerator.getImageMimeType()
            );
        } catch (QrGenerationException ex) {
            throw new IllegalStateException("Unable to generate QR code", ex);
        }
    }

    public boolean verifyCode(String secret, String code) {
        if (secret == null || code == null) {
            return false;
        }
        String trimmed = code.trim().replaceAll("\\s+", "");
        if (trimmed.length() != 6 || !trimmed.chars().allMatch(Character::isDigit)) {
            return false;
        }
        return verifier.isValidCode(secret, trimmed);
    }

    public String generateRecoveryCode() {
        StringBuilder sb = new StringBuilder(RECOVERY_CODE_LENGTH + 1);
        for (int i = 0; i < RECOVERY_CODE_LENGTH; i++) {
            if (i == RECOVERY_CODE_LENGTH / 2) {
                sb.append('-');
            }
            sb.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }
}
