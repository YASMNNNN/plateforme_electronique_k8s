package com.plateforme.electronique.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class RecoveryCodesResponse {
    private List<String> recoveryCodes;
}
