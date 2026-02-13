package com.plateforme.electronique.payment.service;

import com.plateforme.electronique.payment.dto.CardRequest;
import com.plateforme.electronique.payment.entity.Card;
import com.plateforme.electronique.payment.repository.CardRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class CardService {

    private final CardRepository cardRepository;

    public CardService(CardRepository cardRepository) {
        this.cardRepository = cardRepository;
    }

    public Card createCard(CardRequest request) {
        Card card = Card.builder()
                .userId(request.getUserId())
                .cardHolderName(request.getCardHolderName())
                .lastFourDigits(request.getLastFourDigits())
                .cardBrand(request.getCardBrand())
                .expiryMonth(request.getExpiryMonth())
                .expiryYear(request.getExpiryYear())
                .isDefault(request.isDefault())
                .tokenReference(request.getTokenReference())
                .build();
        return cardRepository.save(card);
    }

    public List<Card> getCardsByUser(UUID userId) {
        return cardRepository.findByUserId(userId);
    }

    public Card getCard(UUID id) {
        return cardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Card not found"));
    }

    public void deleteCard(UUID id) {
        if (!cardRepository.existsById(id)) {
            throw new IllegalArgumentException("Card not found");
        }
        cardRepository.deleteById(id);
    }
}
