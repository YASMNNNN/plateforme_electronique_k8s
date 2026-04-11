package com.plateforme.electronique.auth.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtService {

    public static final String TOKEN_TYPE_ACCESS = "access";
    public static final String TOKEN_TYPE_MFA = "mfa";
    public static final String CLAIM_TOKEN_TYPE = "typ";

    private final Key signingKey;
    private final long accessTokenSeconds;
    private final long mfaPendingSeconds;

    public JwtService(
            @Value("${security.jwt.secret}") String secret,
            @Value("${security.jwt.access-token-seconds}") long accessTokenSeconds,
            @Value("${security.mfa.pending-token-seconds:180}") long mfaPendingSeconds
    ) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenSeconds = accessTokenSeconds;
        this.mfaPendingSeconds = mfaPendingSeconds;
    }

    public String generateToken(String subject, Map<String, Object> claims) {
        Map<String, Object> withType = new HashMap<>(claims);
        withType.put(CLAIM_TOKEN_TYPE, TOKEN_TYPE_ACCESS);
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(subject)
                .addClaims(withType)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusSeconds(accessTokenSeconds)))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateMfaPendingToken(String subject, String userId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(subject)
                .addClaims(Map.of(
                        CLAIM_TOKEN_TYPE, TOKEN_TYPE_MFA,
                        "userId", userId
                ))
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusSeconds(mfaPendingSeconds)))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public Jws<Claims> parse(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token);
    }

    public String tokenType(Claims claims) {
        Object typ = claims.get(CLAIM_TOKEN_TYPE);
        return typ == null ? TOKEN_TYPE_ACCESS : typ.toString();
    }

    public long getAccessTokenSeconds() {
        return accessTokenSeconds;
    }

    public long getMfaPendingSeconds() {
        return mfaPendingSeconds;
    }
}
