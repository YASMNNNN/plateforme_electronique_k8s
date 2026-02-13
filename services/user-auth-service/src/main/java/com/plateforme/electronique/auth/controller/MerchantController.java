package com.plateforme.electronique.auth.controller;

import com.plateforme.electronique.auth.dto.*;
import com.plateforme.electronique.auth.entity.User;
import com.plateforme.electronique.auth.repository.UserRepository;
import com.plateforme.electronique.auth.service.AuthService;
import com.plateforme.electronique.auth.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/merchants")
public class MerchantController {

    private final AuthService authService;
    private final UserService userService;
    private final UserRepository userRepository;

    public MerchantController(AuthService authService, UserService userService, UserRepository userRepository) {
        this.authService = authService;
        this.userService = userService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        request.setRole("MERCHANT");
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @GetMapping("/{id}/statistics")
    public ResponseEntity<MerchantStatisticsResponse> statistics(@PathVariable UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Merchant not found"));
        return ResponseEntity.ok(MerchantStatisticsResponse.builder()
                .merchantId(user.getId())
                .companyName(user.getCompanyName())
                .role(user.getRole().name())
                .active(user.isActive())
                .build());
    }

    @PutMapping("/{id}/config")
    public ResponseEntity<UserProfileResponse> updateConfig(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }
}
