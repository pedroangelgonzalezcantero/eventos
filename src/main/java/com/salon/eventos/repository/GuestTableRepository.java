package com.salon.eventos.repository;

import com.salon.eventos.entity.GuestTable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GuestTableRepository extends JpaRepository<GuestTable, Long> {
    List<GuestTable> findByEventIdOrderByPositionAscNameAsc(Long eventId);
    void deleteByEventId(Long eventId);
}

