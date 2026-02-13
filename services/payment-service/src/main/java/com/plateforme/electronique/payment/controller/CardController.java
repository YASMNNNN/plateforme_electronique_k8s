package com.plateforme.electronique.payment.controller;

import com.plateforme.electronique.payment.dto.CardRequest;
import com.plateforme.electronique.payment.entity.Card;
import com.plateforme.electronique.payment.service.CardService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/cards")
public class CardController {

    private final CardService cardService;

    public CardController(CardService cardService) {
        this.cardService = cardService;
    }

    @PostMapping
    public ResponseEntity<Card> create(@Valid @RequestBody CardRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cardService.createCard(request));
    }

    @GetMapping
    public ResponseEntity<List<Card>> listByUser(@RequestParam UUID userId) {
        return ResponseEntity.ok(cardService.getCardsByUser(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Card> detail(@PathVariable UUID id) {
        return ResponseEntity.ok(cardService.getCard(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        cardService.deleteCard(id);
        return ResponseEntity.noContent().build();
    }
}
