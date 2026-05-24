package com.salon.eventos.repository;

import com.salon.eventos.entity.Guest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GuestRepository extends JpaRepository<Guest, Long> {
    List<Guest> findByTableIdOrderByGuestNameAsc(Long tableId);

    @Query("SELECT g FROM Guest g WHERE g.table.event.id = :eventId ORDER BY g.table.position ASC, g.guestName ASC")
    List<Guest> findByEventId(@Param("eventId") Long eventId);

    @Query("SELECT g FROM Guest g WHERE g.table.event.id = :eventId AND (g.allergies IS NOT NULL AND g.allergies <> '') OR (g.diet IS NOT NULL AND g.diet <> '') ORDER BY g.table.name ASC, g.guestName ASC")
    List<Guest> findGuestsWithRestrictionsForEvent(@Param("eventId") Long eventId);
}

