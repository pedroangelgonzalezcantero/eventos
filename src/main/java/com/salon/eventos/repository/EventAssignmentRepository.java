package com.salon.eventos.repository;

import com.salon.eventos.entity.EventAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EventAssignmentRepository extends JpaRepository<EventAssignment, Long> {
    List<EventAssignment> findByEventId(Long eventId);
    List<EventAssignment> findByUserId(Long userId);
    boolean existsByEventIdAndUserId(Long eventId, Long userId);
    Optional<EventAssignment> findByEventIdAndUserId(Long eventId, Long userId);
    void deleteByEventIdAndUserId(Long eventId, Long userId);

    @Query("SELECT ea.event.id FROM EventAssignment ea WHERE ea.user.id = :userId")
    List<Long> findEventIdsByUserId(@Param("userId") Long userId);
}

