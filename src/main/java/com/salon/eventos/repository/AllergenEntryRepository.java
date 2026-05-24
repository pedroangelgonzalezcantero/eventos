package com.salon.eventos.repository;

import com.salon.eventos.entity.AllergenEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AllergenEntryRepository extends JpaRepository<AllergenEntry, Long> {
    List<AllergenEntry> findByEventIdOrderByTableNumberAscGuestNameAsc(Long eventId);
    void deleteByEventId(Long eventId);
}

