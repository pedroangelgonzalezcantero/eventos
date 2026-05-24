package com.salon.eventos.repository;

import com.salon.eventos.entity.ProtocolItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProtocolItemRepository extends JpaRepository<ProtocolItem, Long> {
    List<ProtocolItem> findByEventIdOrderByPositionAscEventTimeAsc(Long eventId);
    void deleteByEventId(Long eventId);
}

