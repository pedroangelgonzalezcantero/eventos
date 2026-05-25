package com.salon.eventos.repository;

import com.salon.eventos.entity.FloorPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FloorPlanRepository extends JpaRepository<FloorPlan, Long> {
    Optional<FloorPlan> findByEventId(Long eventId);
    void deleteByEventId(Long eventId);
}

