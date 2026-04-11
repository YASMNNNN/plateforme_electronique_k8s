package com.plateforme.electronique.auth.controller;

import com.plateforme.electronique.auth.dto.RecoveryCodesResponse;
import com.plateforme.electronique.auth.dto.TotpDisableRequest;
import com.plateforme.electronique.auth.dto.TotpEnableRequest;
import com.plateforme.electronique.auth.dto.TotpSetupResponse;
import com.plateforme.electronique.auth.entity.User;
import com.plateforme.electronique.auth.service.MfaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth/2fa")
public class TwoFactorController {

    private final MfaService mfaService;

    public TwoFactorController(MfaService mfaService) {
        this.mfaService = mfaService;
    }

    @PostMapping("/setup")
    public ResponseEntity<TotpSetupResponse> setup(@AuthenticationPrincipal User user) {
        requireAuth(user);
        return ResponseEntity.ok(mfaService.beginSetup(user));
    }

    @PostMapping("/enable")
    public ResponseEntity<RecoveryCodesResponse> enable(@AuthenticationPrincipal User user,
                                                        @Valid @RequestBody TotpEnableRequest request) {
        requireAuth(user);
        return ResponseEntity.ok(mfaService.enable(user, request.getCode()));
    }

    @PostMapping("/disable")
    public ResponseEntity<Void> disable(@AuthenticationPrincipal User user,
                                        @Valid @RequestBody TotpDisableRequest request) {
        requireAuth(user);
        mfaService.disable(user, request.getPassword(), request.getCode());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/recovery-codes/regenerate")
    public ResponseEntity<RecoveryCodesResponse> regenerate(@AuthenticationPrincipal User user,
                                                            @Valid @RequestBody TotpEnableRequest request) {
        requireAuth(user);
        return ResponseEntity.ok(mfaService.regenerateRecoveryCodesForUser(user, request.getCode()));
    }

    private static void requireAuth(User user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
    }
}
