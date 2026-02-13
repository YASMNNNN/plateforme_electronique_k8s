package com.plateforme.electronique.invoice.repository;

import com.plateforme.electronique.invoice.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    Page<Invoice> findByOwnerUserId(UUID ownerUserId, Pageable pageable);
    Optional<Invoice> findByIdAndOwnerUserId(UUID id, UUID ownerUserId);
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    Page<Invoice> findByOwnerUserIdAndStatus(UUID ownerUserId, Invoice.Status status, Pageable pageable);
    Page<Invoice> findByStatus(Invoice.Status status, Pageable pageable);

    long countByOwnerUserId(UUID ownerUserId);
    long countByOwnerUserIdAndStatus(UUID ownerUserId, Invoice.Status status);

    @Query("SELECT COALESCE(SUM(i.totalTtc), 0) FROM Invoice i WHERE i.ownerUserId = :ownerId AND i.status = 'PAID'")
    BigDecimal sumPaidTotalByOwner(@Param("ownerId") UUID ownerId);
}
