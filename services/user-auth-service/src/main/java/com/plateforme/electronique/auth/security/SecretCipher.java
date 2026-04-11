package com.plateforme.electronique.auth.security;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-256-GCM encryption for secrets at rest (TOTP secrets).
 *
 * Ciphertext layout (base64-encoded): [12-byte IV || ciphertext || 16-byte tag]
 * Key is 32 raw bytes, supplied base64-encoded via MFA_ENCRYPTION_KEY env.
 */
@Component
public class SecretCipher {

    private static final Logger log = LoggerFactory.getLogger(SecretCipher.class);
    private static final String TRANSFORM = "AES/GCM/NoPadding";
    private static final int IV_LENGTH = 12;
    private static final int TAG_LENGTH_BITS = 128;

    private final SecretKeySpec keySpec;
    private final SecureRandom random = new SecureRandom();

    public SecretCipher(@Value("${security.mfa.encryption-key:}") String base64Key) {
        byte[] key;
        if (base64Key == null || base64Key.isBlank()) {
            log.warn("MFA_ENCRYPTION_KEY not set — generating an EPHEMERAL key. "
                    + "Existing enrolled secrets will be unreadable on restart. "
                    + "Set security.mfa.encryption-key (env MFA_ENCRYPTION_KEY) in production.");
            key = new byte[32];
            new SecureRandom().nextBytes(key);
        } else {
            try {
                key = Base64.getDecoder().decode(base64Key);
            } catch (IllegalArgumentException ex) {
                throw new IllegalStateException("security.mfa.encryption-key must be base64-encoded", ex);
            }
            if (key.length != 32) {
                throw new IllegalStateException(
                        "security.mfa.encryption-key must decode to 32 bytes (AES-256), got " + key.length);
            }
        }
        this.keySpec = new SecretKeySpec(key, "AES");
    }

    @PostConstruct
    void selfTest() {
        String probe = "totp-self-test";
        if (!probe.equals(decrypt(encrypt(probe)))) {
            throw new IllegalStateException("SecretCipher self-test failed");
        }
    }

    public String encrypt(String plaintext) {
        if (plaintext == null) {
            return null;
        }
        try {
            byte[] iv = new byte[IV_LENGTH];
            random.nextBytes(iv);
            Cipher cipher = Cipher.getInstance(TRANSFORM);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            byte[] ct = cipher.doFinal(plaintext.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            ByteBuffer buf = ByteBuffer.allocate(iv.length + ct.length);
            buf.put(iv);
            buf.put(ct);
            return Base64.getEncoder().encodeToString(buf.array());
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to encrypt secret", ex);
        }
    }

    public String decrypt(String base64Blob) {
        if (base64Blob == null) {
            return null;
        }
        try {
            byte[] blob = Base64.getDecoder().decode(base64Blob);
            if (blob.length < IV_LENGTH + 16) {
                throw new IllegalStateException("Ciphertext too short");
            }
            byte[] iv = new byte[IV_LENGTH];
            System.arraycopy(blob, 0, iv, 0, IV_LENGTH);
            byte[] ct = new byte[blob.length - IV_LENGTH];
            System.arraycopy(blob, IV_LENGTH, ct, 0, ct.length);
            Cipher cipher = Cipher.getInstance(TRANSFORM);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            return new String(cipher.doFinal(ct), java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to decrypt secret", ex);
        }
    }
}
