package com.salon.eventos.controller;

import com.salon.eventos.entity.NotificationLog;
import com.salon.eventos.repository.EventRepository;
import com.salon.eventos.repository.NotificationLogRepository;
import com.salon.eventos.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@PreAuthorize("hasAnyRole('OFFICE','KITCHEN','DJ','FLOOR')")
public class DashboardController {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private NotificationLogRepository notificationLogRepository;

    @Autowired
    private NotificationService notificationService;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalEvents", eventRepository.count());
        stats.put("activeEvents", eventRepository.countActiveEvents());
        stats.put("recentNotifications",
                notificationLogRepository.findTop50ByOrderBySentAtDesc().size());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<NotificationLog>> getNotifications() {
        return ResponseEntity.ok(notificationLogRepository.findTop50ByOrderBySentAtDesc());
    }

    @GetMapping("/notifications/{eventId}")
    public ResponseEntity<List<NotificationLog>> getNotificationsByEvent(@PathVariable Long eventId) {
        return ResponseEntity.ok(notificationLogRepository.findByEventIdOrderBySentAtDesc(eventId));
    }

    @PostMapping("/send-reminder/{eventId}")
    @PreAuthorize("hasRole('OFFICE')")
    public ResponseEntity<Void> sendManualReminder(@PathVariable Long eventId,
                                                    @RequestBody Map<String, String> body) {
        eventRepository.findById(eventId).ifPresent(event -> {
            String message = body.get("message");
            String channel = body.get("channel");
            String subject = body.getOrDefault("subject", "Recordatorio de tu evento");

            if ("EMAIL".equals(channel)) {
                notificationService.sendEmail(eventId, event.getClientName(), event.getEmail(), subject, message);
            } else if ("SMS".equals(channel)) {
                notificationService.sendSms(eventId, event.getClientName(), event.getPhone(), message);
            } else if ("WHATSAPP".equals(channel)) {
                notificationService.sendWhatsapp(eventId, event.getClientName(), event.getPhone(), message);
            }
        });
        return ResponseEntity.ok().build();
    }
}

