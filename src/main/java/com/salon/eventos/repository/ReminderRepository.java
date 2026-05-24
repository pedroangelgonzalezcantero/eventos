package com.salon.eventos.repository;

import com.salon.eventos.entity.Reminder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReminderRepository extends JpaRepository<Reminder, Long> {
    List<Reminder> findByEventId(Long eventId);
    List<Reminder> findByEventIdAndActiveTrue(Long eventId);
    List<Reminder> findByActiveTrueAndSentFalse();
}

