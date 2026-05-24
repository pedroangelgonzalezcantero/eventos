package com.salon.eventos.repository;

import com.salon.eventos.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByEventId(Long eventId);
}

