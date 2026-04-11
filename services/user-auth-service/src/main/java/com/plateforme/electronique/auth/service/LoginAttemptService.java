package com.plateforme.electronique.auth.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * In-memory rate limiter for auth endpoints.
 *
 * Two independent buckets per request:
 *   - IP:    broad brute-force protection
 *   - Key:   identity-based protection (email for /login, userId for /2fa/verify)
 *
 * Both must have a token available to proceed. Tokens are only consumed on FAILURE,
 * so legitimate users are never throttled.
 */
@Service
public class LoginAttemptService {

    private final ConcurrentMap<String, Bucket> ipBuckets = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, Bucket> keyBuckets = new ConcurrentHashMap<>();

    private static final Bandwidth IP_LIMIT = Bandwidth.classic(
            20, Refill.intervally(20, Duration.ofMinutes(5)));
    private static final Bandwidth KEY_LIMIT = Bandwidth.classic(
            5, Refill.intervally(5, Duration.ofMinutes(15)));

    public boolean isAllowed(String ip, String key) {
        return probe(ipBuckets, ip, IP_LIMIT) && probe(keyBuckets, key, KEY_LIMIT);
    }

    public void recordFailure(String ip, String key) {
        consume(ipBuckets, ip, IP_LIMIT);
        consume(keyBuckets, key, KEY_LIMIT);
    }

    public void reset(String key) {
        if (key != null) {
            keyBuckets.remove(key);
        }
    }

    private boolean probe(ConcurrentMap<String, Bucket> map, String id, Bandwidth limit) {
        if (id == null || id.isBlank()) {
            return true;
        }
        return map.computeIfAbsent(id, k -> Bucket.builder().addLimit(limit).build())
                .getAvailableTokens() > 0;
    }

    private void consume(ConcurrentMap<String, Bucket> map, String id, Bandwidth limit) {
        if (id == null || id.isBlank()) {
            return;
        }
        map.computeIfAbsent(id, k -> Bucket.builder().addLimit(limit).build()).tryConsume(1);
    }
}
