package com.salon.eventos.repository;

import com.salon.eventos.entity.Event;
import com.salon.eventos.entity.EventStatus;
import com.salon.eventos.entity.EventType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findAllByOrderByEventDateAsc();
    List<Event> findByStatus(EventStatus status);
    List<Event> findByType(EventType type);
    List<Event> findByEventDateBetween(LocalDate from, LocalDate to);
    Optional<Event> findByClientUserId(Long clientUserId);
    Optional<Event> findByClientUserUsername(String username);

    @Query("SELECT e FROM Event e WHERE e.eventDate BETWEEN :from AND :to AND e.status NOT IN ('COMPLETADO','CANCELADO')")
    List<Event> findUpcomingEvents(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT COUNT(e) FROM Event e WHERE e.status NOT IN ('COMPLETADO','CANCELADO')")
    long countActiveEvents();
}

