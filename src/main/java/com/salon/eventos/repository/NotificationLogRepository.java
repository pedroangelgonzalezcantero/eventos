package com.salon.eventos.repository;

import com.salon.eventos.entity.NotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationLogRepository extends JpaRepository<NotificationLog, Long> {
    List<NotificationLog> findByEventIdOrderBySentAtDesc(Long eventId);
    List<NotificationLog> findTop50ByOrderBySentAtDesc();
}

