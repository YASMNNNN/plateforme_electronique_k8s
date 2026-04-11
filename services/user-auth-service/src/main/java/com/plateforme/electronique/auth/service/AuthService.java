package com.plateforme.electronique.auth.service;

import com.plateforme.electronique.auth.dto.*;
import com.plateforme.electronique.auth.entity.RefreshToken;
import com.plateforme.electronique.auth.entity.User;
import com.plateforme.electronique.auth.repository.RefreshTokenRepository;
import com.plateforme.electronique.auth.repository.UserRepository;
import com.plateforme.electronique.auth.security.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginAttemptService loginAttemptService;
    private final MfaService mfaService;

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       LoginAttemptService loginAttemptService,
                       MfaService mfaService) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.loginAttemptService = loginAttemptService;
        this.mfaService = mfaService;
    }

    public AuthResponse register(RegisterRequest request) {
        if ("ADMIN".equalsIgnoreCase(request.getRole())) {
            throw new IllegalArgumentException("Cannot self-register as ADMIN");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .companyName(request.getCompanyName())
                .taxId(request.getTaxId())
                .role(User.Role.valueOf(request.getRole()))
                .active(true)
                .build();
        userRepository.save(user);
        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request, String clientIp) {
        String emailKey = request.getEmail() == null ? "" : request.getEmail().toLowerCase();
        if (!loginAttemptService.isAllowed(clientIp, emailKey)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many attempts. Try again later.");
        }

        User user = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (user == null
                || !user.isActive()
                || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            loginAttemptService.recordFailure(clientIp, emailKey);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        if (user.isTotpEnabled()) {
            String mfaToken = jwtService.generateMfaPendingToken(user.getEmail(), user.getId().toString());
            return AuthResponse.builder()
                    .mfaRequired(true)
                    .mfaToken(mfaToken)
                    .mfaExpiresInSeconds(jwtService.getMfaPendingSeconds())
                    .build();
        }

        loginAttemptService.reset(emailKey);
        return buildAuthResponse(user);
    }

    public AuthResponse verifyMfa(MfaVerifyRequest request, String clientIp) {
        Jws<Claims> parsed;
        try {
            parsed = jwtService.parse(request.getMfaToken());
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid MFA token");
        }
        if (!JwtService.TOKEN_TYPE_MFA.equals(jwtService.tokenType(parsed.getBody()))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Wrong token type");
        }
        String email = parsed.getBody().getSubject();
        String userKey = "mfa:" + email.toLowerCase();

        if (!loginAttemptService.isAllowed(clientIp, userKey)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many attempts. Try again later.");
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || !user.isActive() || !user.isTotpEnabled()) {
            loginAttemptService.recordFailure(clientIp, userKey);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid MFA token");
        }

        boolean ok = mfaService.verifyLoginCode(user, request.getCode());
        if (!ok) {
            loginAttemptService.recordFailure(clientIp, userKey);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid verification code");
        }
        loginAttemptService.reset(userKey);
        loginAttemptService.reset(email.toLowerCase());
        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse refresh(RefreshRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));
        if (refreshToken.isRevoked() || refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Refresh token expired");
        }
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);
        return buildAuthResponse(refreshToken.getUser());
    }

    @Transactional
    public void logout(LogoutRequest request) {
        refreshTokenRepository.findByToken(request.getRefreshToken())
                .ifPresent(token -> {
                    token.setRevoked(true);
                    refreshTokenRepository.save(token);
                });
    }

    public UserProfileResponse profile(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .companyName(user.getCompanyName())
                .taxId(user.getTaxId())
                .role(user.getRole().name())
                .active(user.isActive())
                .totpEnabled(user.isTotpEnabled())
                .build();
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtService.generateToken(user.getEmail(), Map.of(
                "role", user.getRole().name(),
                "userId", user.getId().toString()
        ));
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiresAt(LocalDateTime.now().plusDays(7))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .expiresInSeconds(jwtService.getAccessTokenSeconds())
                .build();
    }
}
