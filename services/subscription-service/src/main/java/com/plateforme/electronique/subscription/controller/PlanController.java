package com.plateforme.electronique.subscription.controller;

import com.plateforme.electronique.subscription.entity.Plan;
import com.plateforme.electronique.subscription.repository.PlanRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/plans")
public class PlanController {

    private final PlanRepository planRepository;

    public PlanController(PlanRepository planRepository) {
        this.planRepository = planRepository;
    }

    @GetMapping
    public ResponseEntity<List<Plan>> list() {
        return ResponseEntity.ok(planRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Plan> detail(@PathVariable UUID id) {
        return ResponseEntity.of(planRepository.findById(id));
    }
}
