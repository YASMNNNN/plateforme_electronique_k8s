package com.plateforme.electronique.subscription.service;

import com.plateforme.electronique.subscription.dto.CreateSubscriptionRequest;
import com.plateforme.electronique.subscription.dto.SubscriptionResponse;
import com.plateforme.electronique.subscription.entity.Plan;
import com.plateforme.electronique.subscription.entity.Subscription;
import com.plateforme.electronique.subscription.repository.PlanRepository;
import com.plateforme.electronique.subscription.repository.SubscriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final PlanRepository planRepository;

    public SubscriptionService(SubscriptionRepository subscriptionRepository, PlanRepository planRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.planRepository = planRepository;
    }

    @Transactional
    public SubscriptionResponse create(CreateSubscriptionRequest request) {
        subscriptionRepository.findByUserId(request.getUserId()).ifPresent(existing -> {
            if (existing.getStatus() == Subscription.Status.ACTIVE) {
                throw new IllegalStateException("User already has an active subscription");
            }
        });

        Plan.Name planName = Plan.Name.valueOf(request.getPlanName().toUpperCase());
        Plan plan = planRepository.findByName(planName)
                .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + request.getPlanName()));

        Subscription subscription = Subscription.builder()
                .userId(request.getUserId())
                .plan(plan)
                .status(Subscription.Status.ACTIVE)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusMonths(1))
                .autoRenew(request.isAutoRenew())
                .build();

        return toResponse(subscriptionRepository.save(subscription));
    }

    public SubscriptionResponse getById(UUID id) {
        Subscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));
        return toResponse(subscription);
    }

    public SubscriptionResponse getByUser(UUID userId) {
        Subscription subscription = subscriptionRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("No subscription found for user"));
        return toResponse(subscription);
    }

    @Transactional
    public SubscriptionResponse cancel(UUID id) {
        Subscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));
        subscription.setStatus(Subscription.Status.CANCELLED);
        subscription.setAutoRenew(false);
        return toResponse(subscriptionRepository.save(subscription));
    }

    private SubscriptionResponse toResponse(Subscription s) {
        Plan plan = s.getPlan();
        return SubscriptionResponse.builder()
                .id(s.getId())
                .userId(s.getUserId())
                .status(s.getStatus().name())
                .startDate(s.getStartDate())
                .endDate(s.getEndDate())
                .autoRenew(s.isAutoRenew())
                .planId(plan.getId())
                .planName(plan.getName().name())
                .planDescription(plan.getDescription())
                .priceMonthly(plan.getPriceMonthly())
                .priceAnnual(plan.getPriceAnnual())
                .build();
    }
}
